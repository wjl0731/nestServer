import { Body, Controller, Get, Post, Res } from '@nestjs/common'
import { Response } from 'express'
import { ChatService } from './chat.service'
import { ChatCompletionDto } from './dto/chat.dto'

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /** 可用模型列表 */
  @Get('models')
  models() {
    return { providers: this.chatService.listProviders() }
  }

  /** 非流式：一次性返回完整文本 */
  @Post('completions')
  async completions(@Body() body: ChatCompletionDto) {
    const content = await this.chatService.complete(body.provider, body.messages, {
      model: body.model,
      temperature: body.temperature,
      maxTokens: body.maxTokens
    })
    return { content }
  }

  /** 流式：以 SSE 推送增量内容 */
  @Post('stream')
  async stream(@Body() body: ChatCompletionDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    // 立即刷出 header
    res.flushHeaders?.()

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`)
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    // 客户端断开
    let closed = false
    res.on('close', () => {
      closed = true
    })

    try {
      await this.chatService.stream(
        body.provider,
        body.messages,
        (chunk) => {
          if (closed) return
          send('delta', { content: chunk })
        },
        {
          model: body.model,
          temperature: body.temperature,
          maxTokens: body.maxTokens
        }
      )
      if (!closed) {
        send('done', { ok: true })
      }
    } catch (err: any) {
      if (!closed) {
        send('error', { message: err?.message || '未知错误' })
      }
    } finally {
      if (!closed) res.end()
    }
  }
}
