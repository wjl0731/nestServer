import { IsIn, IsOptional, IsString, Length } from 'class-validator'

export class UpdateUserInfoDto {
  @IsOptional()
  @IsIn(['male', 'female', 'unknown'], { message: '性别取值不合法' })
  gender?: 'male' | 'female' | 'unknown'

  @IsOptional()
  @IsString()
  @Length(0, 255, { message: '个性签名最长 255 字符' })
  signature?: string
}
