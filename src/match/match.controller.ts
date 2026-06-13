import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MatchService } from './match.service'
import { MatchCompaniesDto, MatchInstitutionsDto } from './dto/match.dto'

/**
 * 撮合接口，供 Coze 插件实时调用。
 * 若配置了 MATCH_API_TOKEN，则要求请求头 Authorization: Bearer <token>。
 */
@Controller('match')
export class MatchController {
  constructor(
    private readonly matchService: MatchService,
    private readonly config: ConfigService
  ) {}

  private assertToken(auth?: string) {
    const expected = this.config.get<string>('MATCH_API_TOKEN')
    if (!expected) return // 未配置则不校验（本地/调试）
    const got = (auth || '').replace(/^Bearer\s+/i, '').trim()
    if (got !== expected) {
      throw new UnauthorizedException('无效的接口令牌')
    }
  }

  /** 为项目方公司找匹配的投资机构 */
  @Post('institutions')
  matchInstitutions(@Body() body: MatchInstitutionsDto, @Headers('authorization') auth?: string) {
    this.assertToken(auth)
    return this.matchService.matchInstitutions(body)
  }

  /** 为投资机构找匹配的项目方公司 */
  @Post('companies')
  matchCompanies(@Body() body: MatchCompaniesDto, @Headers('authorization') auth?: string) {
    this.assertToken(auth)
    return this.matchService.matchCompanies(body)
  }
}
