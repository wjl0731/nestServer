import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
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

@Injectable()
export class AuthService {
  private readonly captchaTtl: number
  private readonly emailCodeTtl: number

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    config: ConfigService
  ) {
    this.captchaTtl = Number(config.get<string>('CAPTCHA_TTL') ?? '300')
    this.emailCodeTtl = Number(config.get<string>('EMAIL_CODE_TTL') ?? '600')
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
      // 直接返回 SVG 字符串，前端可放进 <img src="data:image/svg+xml;base64,..."> 或直接 v-html
      svg: cap.data,
      expiresIn: this.captchaTtl
    }
  }

  private async consumeCaptcha(captchaId: string, captchaText: string) {
    const key = CAPTCHA_PREFIX + captchaId
    const expected = await this.redis.get(key)
    if (!expected) throw new BadRequestException('图形验证码已过期，请刷新')
    if (expected !== captchaText.trim().toLowerCase()) {
      throw new BadRequestException('图形验证码错误')
    }
    // 一次性使用
    await this.redis.del(key)
  }

  async sendEmailCode(dto: SendEmailCodeDto) {
    await this.consumeCaptcha(dto.captchaId, dto.captchaText)

    // 同一邮箱发送频率限制：60s 内只允许一次
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

    const token = this.signToken(saved.id, saved.email)
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

    const token = this.signToken(user.id, user.email)
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

  private signToken(userId: string, email: string) {
    return this.jwt.sign({ sub: userId, email })
  }
}
