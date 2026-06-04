import { Logger } from '@nestjs/common'
import { ChatMessageDto } from '../dto/chat.dto'
import { ChatCallOptions, IChatProvider, StreamHandler } from './provider.interface'

/**
 * OpenAI Chat Completions 兼容的 Provider 基类。
 * Qwen / DeepSeek / OpenAI 均使用同一套 /chat/completions 协议。
 */
export abstract class OpenAICompatibleProvider implements IChatProvider {
  abstract readonly name: string
  abstract readonly defaultModel: string
  protected abstract readonly baseUrl: string
  protected abstract readonly apiKey: string

  protected readonly logger = new Logger(this.constructor.name)

  isAvailable(): boolean {
    return !!this.apiKey && !!this.baseUrl
  }

  private buildBody(messages: ChatMessageDto[], options: ChatCallOptions | undefined, stream: boolean) {
    return {
      model: options?.model || this.defaultModel,
      messages,
      stream,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048
    }
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`
    }
  }

  async complete(messages: ChatMessageDto[], options?: ChatCallOptions): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error(`${this.name} 未配置 API Key`)
    }
    const url = `${this.baseUrl.replace(/\/+$/, '')}/chat/completions`
    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(this.buildBody(messages, options, false))
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`${this.name} 调用失败 (${res.status}): ${text}`)
    }
    const data: any = await res.json()
    return data?.choices?.[0]?.message?.content ?? ''
  }

  async stream(
    messages: ChatMessageDto[],
    onChunk: StreamHandler,
    options?: ChatCallOptions
  ): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error(`${this.name} 未配置 API Key`)
    }
    const url = `${this.baseUrl.replace(/\/+$/, '')}/chat/completions`
    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(this.buildBody(messages, options, true))
    })
    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => '')
      throw new Error(`${this.name} 流式调用失败 (${res.status}): ${text}`)
    }

    const reader = (res.body as any).getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // SSE: 以 \n\n 分隔事件
      let idx: number
      while ((idx = buffer.indexOf('\n\n')) >= 0) {
        const rawEvent = buffer.slice(0, idx)
        buffer = buffer.slice(idx + 2)
        const lines = rawEvent.split('\n')
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const payload = trimmed.slice(5).trim()
          if (payload === '[DONE]') return
          if (!payload) continue
          try {
            const json = JSON.parse(payload)
            const delta = json?.choices?.[0]?.delta?.content
            if (typeof delta === 'string' && delta.length > 0) {
              onChunk(delta)
            }
          } catch (err) {
            this.logger.warn(`SSE parse error: ${(err as Error).message} payload=${payload.slice(0, 80)}`)
          }
        }
      }
    }
  }
}
