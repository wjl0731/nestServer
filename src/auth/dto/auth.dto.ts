import { IsEmail, IsString, Length, Matches } from 'class-validator'

export class SendEmailCodeDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string

  @IsString()
  captchaId: string

  @IsString()
  @Length(4, 6, { message: '图形验证码长度不正确' })
  captchaText: string
}

export class RegisterDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string

  @IsString()
  @Length(6, 32, { message: '密码长度需为 6-32 位' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: '密码需包含字母和数字' })
  password: string

  @IsString()
  @Length(4, 8, { message: '邮箱验证码长度不正确' })
  emailCode: string
}

export class LoginDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string

  @IsString()
  @Length(6, 32)
  password: string

  @IsString()
  captchaId: string

  @IsString()
  @Length(4, 6, { message: '图形验证码长度不正确' })
  captchaText: string
}
