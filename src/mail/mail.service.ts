import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name)
  private transporter: nodemailer.Transporter | null = null
  private fromName = 'NestApp'
  private fromAddress = ''

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const host = this.config.get<string>('SMTP_HOST')
    const user = this.config.get<string>('SMTP_USER')
    const pass = this.config.get<string>('SMTP_PASS')

    if (!host || !user || !pass) {
      this.logger.warn('SMTP not fully configured, emails will be logged to console only')
      return
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(this.config.get<string>('SMTP_PORT') ?? '465'),
      secure: String(this.config.get<string>('SMTP_SECURE') ?? 'true') === 'true',
      auth: { user, pass }
    })
    this.fromName = this.config.get<string>('SMTP_FROM_NAME') ?? 'NestApp'
    this.fromAddress = user
  }

  async sendVerificationCode(to: string, code: string, ttlSeconds: number) {
    const minutes = Math.ceil(ttlSeconds / 60)
    const subject = '【验证码】请在邮件中查收'
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <p>您好，</p>
        <p>您的验证码是：</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
        <p>验证码 ${minutes} 分钟内有效，请勿泄漏给他人。</p>
      </div>
    `

    if (!this.transporter) {
      this.logger.log(`[DEV] email code to ${to}: ${code}`)
      return
    }

    await this.transporter.sendMail({
      from: `"${this.fromName}" <${this.fromAddress}>`,
      to,
      subject,
      html
    })
  }
}
