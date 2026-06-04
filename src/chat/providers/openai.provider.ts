import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OpenAICompatibleProvider } from './openai-compatible.provider'

@Injectable()
export class OpenAIProvider extends OpenAICompatibleProvider {
  readonly name = 'openai'
  readonly defaultModel = 'gpt-4o-mini'
  protected readonly baseUrl: string
  protected readonly apiKey: string

  constructor(config: ConfigService) {
    super()
    this.apiKey = config.get<string>('OPENAI_API_KEY') || ''
    this.baseUrl = config.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1'
  }
}
