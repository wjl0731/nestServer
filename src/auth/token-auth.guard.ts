import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { AuthService } from './auth.service'

@Injectable()
export class TokenAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest()
    req.user = await this.authService.validateAccessToken(req.headers.authorization)
    return true
  }
}
