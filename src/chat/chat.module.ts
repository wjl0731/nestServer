import { Module } from '@nestjs/common'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { QwenProvider } from './providers/qwen.provider'
import { DeepSeekProvider } from './providers/deepseek.provider'
import { OpenAIProvider } from './providers/openai.provider'
import { CozeProvider } from './providers/coze.provider'

@Module({
  controllers: [ChatController],
  providers: [ChatService, QwenProvider, DeepSeekProvider, OpenAIProvider, CozeProvider],
  exports: [ChatService]
})
export class ChatModule {}
