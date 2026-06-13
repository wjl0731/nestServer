import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { IChatProvider, StreamHandler, ChatCallOptions } from './providers/provider.interface'
import { QwenProvider } from './providers/qwen.provider'
import { DeepSeekProvider } from './providers/deepseek.provider'
import { OpenAIProvider } from './providers/openai.provider'
import { CozeProvider } from './providers/coze.provider'
import { ChatMessageDto } from './dto/chat.dto'

@Injectable()
export class ChatService {
  private readonly providers: Map<string, IChatProvider>
  private readonly defaultProviderName: string

  constructor(
    config: ConfigService,
    @Inject(QwenProvider) qwen: QwenProvider,
    @Inject(DeepSeekProvider) deepseek: DeepSeekProvider,
    @Inject(OpenAIProvider) openai: OpenAIProvider,
    @Inject(CozeProvider) coze: CozeProvider
  ) {
    this.providers = new Map<string, IChatProvider>([
      [qwen.name, qwen],
      [deepseek.name, deepseek],
      [openai.name, openai],
      [coze.name, coze]
    ])
    this.defaultProviderName = config.get<string>('DEFAULT_PROVIDER') || 'qwen'
  }

  listProviders() {
    return Array.from(this.providers.values()).map((p) => ({
      name: p.name,
      defaultModel: p.defaultModel,
      available: p.isAvailable()
    }))
  }

  resolve(providerName?: string): IChatProvider {
    const key = providerName || this.defaultProviderName
    const p = this.providers.get(key)
    if (!p) {
      throw new NotFoundException(`Provider "${key}" 不存在`)
    }
    return p
  }

  async complete(
    providerName: string | undefined,
    messages: ChatMessageDto[],
    options?: ChatCallOptions
  ): Promise<string> {
    return this.resolve(providerName).complete(messages, options)
  }

  async stream(
    providerName: string | undefined,
    messages: ChatMessageDto[],
    onChunk: StreamHandler,
    options?: ChatCallOptions
  ): Promise<void> {
    return this.resolve(providerName).stream(messages, onChunk, options)
  }
}
