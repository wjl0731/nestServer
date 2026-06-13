import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ChatMessageDto } from '../dto/chat.dto'
import { ChatCallOptions, IChatProvider, StreamHandler } from './provider.interface'

/**
 * Coze（扣子）Provider。
 *
 * 注意：Coze 不是 OpenAI 兼容协议，而是使用自有的 /v3/chat 接口：
 *  - 需要 bot_id（在 Coze 平台创建的智能体 ID）
 *  - 使用 additional_messages 传入对话，只接受 user / assistant 角色
 *  - 流式返回为自有 SSE 事件（conversation.message.delta 等）
 *
 * 文档：https://www.coze.cn/open/docs/developer_guides/chat_v3
 */
@Injectable()
export class CozeProvider implements IChatProvider {
  readonly name = 'coze'
  readonly defaultModel: string

  private readonly logger = new Logger(CozeProvider.name)
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly botId: string
  private readonly userId: string

  constructor(config: ConfigService) {
    // PAT，形如 pat_xxx
    this.apiKey = config.get<string>('COZE_API_KEY') || ''
    this.baseUrl = config.get<string>('COZE_BASE_URL') || 'https://api.coze.cn'
    this.botId = config.get<string>('COZE_BOT_ID') || ''
    this.userId = config.get<string>('COZE_USER_ID') || 'nest-user'
    // Coze 的“模型”由 bot 决定，这里仅用于列表展示
    this.defaultModel = this.botId || 'coze-bot'
  }

  isAvailable(): boolean {
    return !!this.apiKey && !!this.botId
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`
    }
  }

  /** 将通用消息转换为 Coze additional_messages（system 角色降级为 user）。 */
  private toAdditionalMessages(messages: ChatMessageDto[]) {
    return messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      type: m.role === 'assistant' ? 'answer' : 'question',
      content: m.content,
      content_type: 'text'
    }))
  }

  private buildBody(messages: ChatMessageDto[], stream: boolean) {
    return {
      bot_id: this.botId,
      user_id: this.userId,
      stream,
      auto_save_history: true,
      additional_messages: this.toAdditionalMessages(messages)
    }
  }

  /** 非流式：内部复用流式接口并拼接完整回答。 */
  async complete(messages: ChatMessageDto[], _options?: ChatCallOptions): Promise<string> {
    let full = ''
    await this.stream(messages, (chunk) => {
      full += chunk
    })
    return full
  }

  async stream(
    messages: ChatMessageDto[],
    onChunk: StreamHandler,
    _options?: ChatCallOptions
  ): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('coze 未配置 COZE_API_KEY 或 COZE_BOT_ID')
    }
    const url = `${this.baseUrl.replace(/\/+$/, '')}/v3/chat`
    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(this.buildBody(messages, true))
    })
    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => '')
      throw new Error(`coze 流式调用失败 (${res.status}): ${text}`)
    }

    // Coze 在出错时会以 HTTP 200 + application/json 返回错误体（而非 SSE 流），
    // 例如 bot 未发布到「Agent as API」渠道（code 4015）。需在此识别并抛出，
    // 否则会被当作空流静默结束，前端收不到任何内容也看不到报错。
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('text/event-stream')) {
      const text = await res.text().catch(() => '')
      let msg = text
      try {
        const json = JSON.parse(text)
        if (json?.code && json.code !== 0) {
          throw new Error(`coze 调用失败 (code ${json.code}): ${json.msg || text}`)
        }
        msg = json?.msg || text
      } catch (err) {
        if (err instanceof Error && err.message.startsWith('coze 调用失败')) throw err
      }
      throw new Error(`coze 返回非流式响应：${msg}`)
    }

    const reader = (res.body as any).getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // Coze SSE：以 \n\n 分隔事件，事件含 event: 与 data: 两行
      let idx: number
      while ((idx = buffer.indexOf('\n\n')) >= 0) {
        const rawEvent = buffer.slice(0, idx)
        buffer = buffer.slice(idx + 2)
        this.handleEvent(rawEvent, onChunk)
      }
    }
  }

  private handleEvent(rawEvent: string, onChunk: StreamHandler) {
    let eventName = ''
    let dataLine = ''
    for (const line of rawEvent.split('\n')) {
      const trimmed = line.trim()
      if (trimmed.startsWith('event:')) {
        eventName = trimmed.slice(6).trim()
      } else if (trimmed.startsWith('data:')) {
        dataLine = trimmed.slice(5).trim()
      }
    }
    if (!eventName || !dataLine) return
    if (eventName === 'done' || dataLine === '[DONE]') return

    // Coze 流内错误事件：透出为异常，避免静默结束
    if (eventName === 'error' || eventName === 'conversation.chat.failed') {
      let msg = dataLine
      try {
        const json = JSON.parse(dataLine)
        msg = json?.last_error?.msg || json?.msg || json?.message || dataLine
      } catch (_) {}
      throw new Error(`coze 流式错误：${msg}`)
    }

    // 仅关心增量回答事件
    if (eventName !== 'conversation.message.delta') return

    try {
      const json = JSON.parse(dataLine)
      // 只取 type=answer 的内容增量，过滤 function_call / verbose 等
      if (json?.type === 'answer' && typeof json?.content === 'string' && json.content.length > 0) {
        onChunk(json.content)
      }
    } catch (err) {
      this.logger.warn(
        `Coze SSE parse error: ${(err as Error).message} data=${dataLine.slice(0, 80)}`
      )
    }
  }
}
