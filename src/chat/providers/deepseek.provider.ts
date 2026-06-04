import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OpenAICompatibleProvider } from './openai-compatible.provider'

@Injectable()
export class DeepSeekProvider extends OpenAICompatibleProvider {
  readonly name = 'deepseek'
  readonly defaultModel = 'deepseek-chat'
  protected readonly baseUrl: string
  protected readonly apiKey: string

  constructor(config: ConfigService) {
    super()
    this.apiKey = config.get<string>('DEEPSEEK_API_KEY') || ''
    this.baseUrl = config.get<string>('DEEPSEEK_BASE_URL') || 'https://api.deepseek.com/v1'
  }
}
