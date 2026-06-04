import { ChatMessageDto } from '../dto/chat.dto'

export interface ChatCallOptions {
  model?: string
  temperature?: number
  maxTokens?: number
}

/** 流式增量回调 */
export type StreamHandler = (chunk: string) => void

export interface IChatProvider {
  readonly name: string
  /** 默认模型 */
  readonly defaultModel: string
  /** 是否可用（已配置 API key） */
  isAvailable(): boolean
  /** 非流式：返回完整文本 */
  complete(messages: ChatMessageDto[], options?: ChatCallOptions): Promise<string>
  /** 流式：逐块回调，回调结束 promise resolve */
  stream(
    messages: ChatMessageDto[],
    onChunk: StreamHandler,
    options?: ChatCallOptions
  ): Promise<void>
}
