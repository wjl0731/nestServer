import { IsArray, IsIn, IsOptional, IsString, ValidateNested, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'

export type ChatRole = 'system' | 'user' | 'assistant'

export class ChatMessageDto {
  @IsIn(['system', 'user', 'assistant'])
  role!: ChatRole

  @IsString()
  content!: string
}

export class ChatCompletionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[]

  @IsOptional()
  @IsString()
  provider?: string // qwen | deepseek | openai

  @IsOptional()
  @IsString()
  model?: string

  @IsOptional()
  @IsNumber()
  temperature?: number

  @IsOptional()
  @IsNumber()
  maxTokens?: number
}
