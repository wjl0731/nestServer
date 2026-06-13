import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcryptjs'
import Redis from 'ioredis'
import * as svgCaptcha from 'svg-captcha'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { MailService } from '../mail/mail.service'
import { REDIS_CLIENT } from '../redis/redis.module'
import { User } from '../user/user.entity'
import { LoginDto, RegisterDto, SendEmailCodeDto } from './dto/auth.dto'

const CAPTCHA_PREFIX = 'captcha:img:'
const EMAIL_CODE_PREFIX = 'captcha:email:'
const SEND_LIMIT_PREFIX = 'captcha:email-limit:'
const SESSION_TOKEN_PREFIX = 'auth:session:token:'
const USER_SESSION_SET_PREFIX = 'auth:session:user:'

interface AuthSessionData {
  token: string
  userId: string
  email: string
}

@Injectable()
export class AuthService {
  private readonly captchaTtl: number
  private readonly emailCodeTtl: number
  private readonly tokenTtl: number

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly mail: MailService,
    config: ConfigService
  ) {
    this.captchaTtl = Number(config.get<string>('CAPTCHA_TTL') ?? '300')
    this.emailCodeTtl = Number(config.get<string>('EMAIL_CODE_TTL') ?? '600')
    this.tokenTtl = this.parseDurationToSeconds(
      config.get<string>('TOKEN_TTL') ?? config.get<string>('JWT_EXPIRES_IN') ?? '7d'
    )
  }

  async generateCaptcha() {
    const cap = svgCaptcha.create({
      size: 4,
      noise: 2,
      color: true,
      background: '#f0f2f5',
      ignoreChars: '0o1ilI'
    })
    const captchaId = uuidv4()
    await this.redis.set(
      CAPTCHA_PREFIX + captchaId,
      cap.text.toLowerCase(),
      'EX',
      this.captchaTtl
    )
    return {
      captchaId,
      svg: cap.data,
      expiresIn: this.captchaTtl
    }
  }

  async sendEmailCode(dto: SendEmailCodeDto) {
    await this.consumeCaptcha(dto.captchaId, dto.captchaText)

    const limitKey = SEND_LIMIT_PREFIX + dto.email
    const limited = await this.redis.get(limitKey)
    if (limited) throw new BadRequestException('请求过于频繁，请稍后再试')

    const code = String(Math.floor(100000 + Math.random() * 900000))
    await this.redis.set(EMAIL_CODE_PREFIX + dto.email, code, 'EX', this.emailCodeTtl)
    await this.redis.set(limitKey, '1', 'EX', 60)

    await this.mail.sendVerificationCode(dto.email, code, this.emailCodeTtl)
    return { ok: true, expiresIn: this.emailCodeTtl }
  }

  async register(dto: RegisterDto) {
    const codeKey = EMAIL_CODE_PREFIX + dto.email
    const expected = await this.redis.get(codeKey)
    if (!expected) throw new BadRequestException('邮箱验证码已过期，请重新获取')
    if (expected !== dto.emailCode.trim()) {
      throw new BadRequestException('邮箱验证码错误')
    }

    const exists = await this.userRepo.findOne({ where: { email: dto.email } })
    if (exists) throw new ConflictException('该邮箱已被注册')

    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = this.userRepo.create({
      email: dto.email,
      password: passwordHash,
      gender: 'unknown',
      signature: ''
    })
    const saved = await this.userRepo.save(user)
    await this.redis.del(codeKey)

    const token = await this.createSession(saved.id, saved.email)
    return {
      token,
      user: {
        id: saved.id,
        email: saved.email,
        gender: saved.gender,
        signature: saved.signature
      }
    }
  }

  async login(dto: LoginDto) {
    await this.consumeCaptcha(dto.captchaId, dto.captchaText)

    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.email = :email', { email: dto.email })
      .getOne()
    if (!user) throw new UnauthorizedException('邮箱或密码错误')

    const ok = await bcrypt.compare(dto.password, user.password)
    if (!ok) throw new UnauthorizedException('邮箱或密码错误')

    const token = await this.createSession(user.id, user.email)
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        gender: user.gender,
        signature: user.signature
      }
    }
  }

  async validateAccessToken(authorization?: string | string[]) {
    const token = this.extractBearerToken(authorization)
    if (!token) {
      throw new UnauthorizedException('未登录或登录已失效')
    }

    const session = await this.redis.get(SESSION_TOKEN_PREFIX + token)
    if (!session) {
      throw new UnauthorizedException('登录已失效，请重新登录')
    }

    let data: AuthSessionData
    try {
      data = JSON.parse(session) as AuthSessionData
    } catch (_) {
      await this.redis.del(SESSION_TOKEN_PREFIX + token)
      throw new UnauthorizedException('登录状态异常，请重新登录')
    }

    if (!data?.userId || !data?.email) {
      await this.redis.del(SESSION_TOKEN_PREFIX + token)
      throw new UnauthorizedException('登录状态异常，请重新登录')
    }

    await this.redis.expire(USER_SESSION_SET_PREFIX + data.userId, this.tokenTtl)
    return {
      userId: data.userId,
      email: data.email,
      token
    }
  }

  async logoutCurrent(payload: Pick<AuthSessionData, 'userId' | 'token'>) {
    if (payload.token) {
      await this.redis.del(SESSION_TOKEN_PREFIX + payload.token)
    }
    if (payload.userId) {
      await this.redis.srem(USER_SESSION_SET_PREFIX + payload.userId, payload.token)
      const sessionCount = await this.redis.scard(USER_SESSION_SET_PREFIX + payload.userId)
      if (sessionCount === 0) {
        await this.redis.del(USER_SESSION_SET_PREFIX + payload.userId)
      }
    }
    return { ok: true }
  }

  async logoutAll(userId: string) {
    const userKey = USER_SESSION_SET_PREFIX + userId
    const tokens = await this.redis.smembers(userKey)
    const pipeline = this.redis.multi()
    for (const token of tokens) {
      pipeline.del(SESSION_TOKEN_PREFIX + token)
    }
    pipeline.del(userKey)
    await pipeline.exec()
    return { ok: true, count: tokens.length }
  }

  private async consumeCaptcha(captchaId: string, captchaText: string) {
    const key = CAPTCHA_PREFIX + captchaId
    const expected = await this.redis.get(key)
    if (!expected) throw new BadRequestException('图形验证码已过期，请刷新')
    if (expected !== captchaText.trim().toLowerCase()) {
      throw new BadRequestException('图形验证码错误')
    }
    await this.redis.del(key)
  }

  private async createSession(userId: string, email: string) {
    const token = this.generateToken()
    const userKey = USER_SESSION_SET_PREFIX + userId
    const sessionKey = SESSION_TOKEN_PREFIX + token
    const payload: AuthSessionData = { token, userId, email }

    await this.redis
      .multi()
      .set(sessionKey, JSON.stringify(payload), 'EX', this.tokenTtl)
      .sadd(userKey, token)
      .expire(userKey, this.tokenTtl)
      .exec()

    return token
  }

  private extractBearerToken(authorization?: string | string[]) {
    const value = Array.isArray(authorization) ? authorization[0] : authorization
    if (!value) return ''
    const match = value.match(/^Bearer\s+(.+)$/i)
    return match?.[1]?.trim() ?? ''
  }

  private generateToken() {
    return `${uuidv4().replace(/-/g, '')}${uuidv4().replace(/-/g, '')}`
  }

  private parseDurationToSeconds(value: string) {
    const input = value.trim()
    if (/^\d+$/.test(input)) {
      return Number(input)
    }

    const match = input.match(/^(\d+)([smhd])$/i)
    if (!match) {
      return 7 * 24 * 60 * 60
    }

    const amount = Number(match[1])
    const unit = match[2].toLowerCase()
    const multipliers = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60
    }
    return amount * multipliers[unit as keyof typeof multipliers]
  }
}
