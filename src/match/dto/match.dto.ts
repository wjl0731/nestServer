import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

/** 为「项目方公司」找投资机构 */
export class MatchInstitutionsDto {
  /** 传公司名则自动读取其领域/阶段/金额/城市作为条件 */
  @IsOptional()
  @IsString()
  companyName?: string

  /** 也可直接传条件（与 companyName 二选一；都传时以显式条件覆盖） */
  @IsOptional()
  @IsString()
  field?: string

  @IsOptional()
  @IsString()
  stage?: string

  /** 本轮融资需求（万元） */
  @IsOptional()
  @IsInt()
  amount?: number

  @IsOptional()
  @IsString()
  city?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number
}

/** 为「投资机构」找项目方公司 */
export class MatchCompaniesDto {
  /** 传机构名则自动读取其领域/阶段/金额区间/城市作为条件 */
  @IsOptional()
  @IsString()
  institutionName?: string

  @IsOptional()
  @IsString()
  field?: string

  @IsOptional()
  @IsString()
  stage?: string

  /** 单笔可投金额（万元），用于匹配公司融资需求 */
  @IsOptional()
  @IsInt()
  amount?: number

  @IsOptional()
  @IsString()
  city?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number
}
