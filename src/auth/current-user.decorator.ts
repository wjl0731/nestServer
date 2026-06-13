import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export interface CurrentUserPayload {
  userId: string
  email: string
  token: string
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const req = ctx.switchToHttp().getRequest()
    return req.user as CurrentUserPayload
  }
)
