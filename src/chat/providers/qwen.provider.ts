import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OpenAICompatibleProvider } from './openai-compatible.provider'

@Injectable()
export class QwenProvider extends OpenAICompatibleProvider {
  readonly name = 'qwen'
  readonly defaultModel: string
  protected readonly baseUrl: string
  protected readonly apiKey: string

  constructor(config: ConfigService) {
    super()
    this.apiKey = config.get<string>('QWEN_API_KEY') || ''
    this.baseUrl =
      config.get<string>('QWEN_BASE_URL') || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    this.defaultModel = config.get<string>('DEFAULT_MODEL') || 'qwen-turbo'
  }
}
