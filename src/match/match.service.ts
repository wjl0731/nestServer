import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Institution } from './institution.entity'
import { Company } from './company.entity'
import { COMPANY_SEED, INSTITUTION_SEED } from './seed-data'
import { MatchCompaniesDto, MatchInstitutionsDto } from './dto/match.dto'

/** 解析后的撮合条件 */
export interface Criteria {
  fields: string[]
  stage: string
  amount?: number
  city?: string
}

@Injectable()
export class MatchService implements OnModuleInit {
  private readonly logger = new Logger(MatchService.name)

  constructor(
    @InjectRepository(Institution) private readonly institutions: Repository<Institution>,
    @InjectRepository(Company) private readonly companies: Repository<Company>
  ) {}

  /** 首次启动且表为空时写入种子数据 */
  async onModuleInit() {
    if ((await this.institutions.count()) === 0) {
      await this.institutions.save(INSTITUTION_SEED)
      this.logger.log(`已写入 ${INSTITUTION_SEED.length} 条投资机构种子数据`)
    }
    if ((await this.companies.count()) === 0) {
      await this.companies.save(COMPANY_SEED)
      this.logger.log(`已写入 ${COMPANY_SEED.length} 条项目方公司种子数据`)
    }
  }

  // ── 工具方法 ──────────────────────────────────────────────

  private tokens(s?: string): string[] {
    return (s || '')
      .split(/[\/、,，\s]+/)
      .map((x) => x.trim())
      .filter(Boolean)
  }

  /** 两组多值字段是否有交集 */
  private overlap(a: string[], b: string[]): string[] {
    return a.filter((x) => b.some((y) => x === y || x.includes(y) || y.includes(x)))
  }

  // ── 为公司找机构 ─────────────────────────────────────────

  async matchInstitutions(dto: MatchInstitutionsDto) {
    const criteria = await this.resolveCompanyCriteria(dto)
    const limit = dto.limit ?? 5

    /*
     * 数据量小，这里直接读全量在内存里打分。
     * 数据量大时应把 amount(BETWEEN)、city、stage 等硬条件下推为 SQL WHERE，
     * 并对 fields 建标签表或全文索引后再排序 LIMIT，避免全表加载。
     */
    const all = await this.institutions.find()
    const scored = all
      .map((inst) => {
        const reasons: string[] = []
        let score = 0

        const fieldHit = this.overlap(criteria.fields, this.tokens(inst.fields))
        if (fieldHit.length) {
          score += 3 + (fieldHit.length - 1)
          reasons.push(`投资领域涵盖「${fieldHit.join('、')}」`)
        }

        if (criteria.stage && this.tokens(inst.stages).some((s) => s === criteria.stage)) {
          score += 2
          reasons.push(`覆盖「${criteria.stage}」阶段`)
        }

        if (typeof criteria.amount === 'number') {
          if (criteria.amount >= inst.amountMin && criteria.amount <= inst.amountMax) {
            score += 2
            reasons.push(`单笔 ${inst.amountMin}-${inst.amountMax}万 可覆盖 ${criteria.amount}万 需求`)
          }
        }

        if (criteria.city && inst.city === criteria.city) {
          score += 1
          reasons.push(`同城（${inst.city}）便于对接`)
        }

        return { inst, score, reasons }
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    return {
      query: criteria,
      count: scored.length,
      matches: scored.map(({ inst, score, reasons }) => ({
        name: inst.name,
        type: inst.type,
        fields: inst.fields,
        stages: inst.stages,
        amountRange: `${inst.amountMin}-${inst.amountMax}万元`,
        city: inst.city,
        preference: inst.preference,
        contact: inst.contact,
        phone: inst.phone,
        matchScore: score,
        reasons
      }))
    }
  }

  private async resolveCompanyCriteria(dto: MatchInstitutionsDto): Promise<Criteria> {
    let base: Criteria = { fields: [], stage: '', amount: undefined, city: undefined }
    if (dto.companyName) {
      const c = await this.companies.findOne({ where: { name: dto.companyName } })
      if (!c) throw new NotFoundException(`未找到公司「${dto.companyName}」`)
      base = {
        fields: this.tokens(c.field),
        stage: c.stage,
        amount: c.fundingNeed,
        city: c.city
      }
    }
    // 显式条件覆盖
    if (dto.field) base.fields = this.tokens(dto.field)
    if (dto.stage) base.stage = dto.stage
    if (typeof dto.amount === 'number') base.amount = dto.amount
    if (dto.city) base.city = dto.city
    return base
  }

  // ── 为机构找公司 ─────────────────────────────────────────

  async matchCompanies(dto: MatchCompaniesDto) {
    const criteria = await this.resolveInstitutionCriteria(dto)
    const limit = dto.limit ?? 5

    const all = await this.companies.find()
    const scored = all
      .map((c) => {
        const reasons: string[] = []
        let score = 0

        const fieldHit = this.overlap(criteria.fields, this.tokens(c.field))
        if (fieldHit.length) {
          score += 3 + (fieldHit.length - 1)
          reasons.push(`所属领域「${fieldHit.join('、')}」匹配投资方向`)
        }

        if (criteria.stage && this.tokens(criteria.stage).some((s) => s === c.stage)) {
          score += 2
          reasons.push(`处于「${c.stage}」阶段，符合投资阶段`)
        }

        if (typeof criteria.amount === 'number') {
          // criteria.amount 此处用作机构单笔上限的参考：公司需求不超过该上限
          if (c.fundingNeed <= criteria.amount) {
            score += 2
            reasons.push(`融资需求 ${c.fundingNeed}万 在可投额度内`)
          }
        }

        if (criteria.city && c.city === criteria.city) {
          score += 1
          reasons.push(`同城（${c.city}）`)
        }

        return { c, score, reasons }
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    return {
      query: criteria,
      count: scored.length,
      matches: scored.map(({ c, score, reasons }) => ({
        name: c.name,
        field: c.field,
        city: c.city,
        stage: c.stage,
        fundingNeed: `${c.fundingNeed}万元`,
        valuation: `${c.valuation}万元`,
        teamSize: c.teamSize,
        business: c.business,
        contact: c.contact,
        phone: c.phone,
        matchScore: score,
        reasons
      }))
    }
  }

  private async resolveInstitutionCriteria(dto: MatchCompaniesDto): Promise<Criteria> {
    let base: Criteria = { fields: [], stage: '', amount: undefined, city: undefined }
    if (dto.institutionName) {
      const i = await this.institutions.findOne({ where: { name: dto.institutionName } })
      if (!i) throw new NotFoundException(`未找到机构「${dto.institutionName}」`)
      base = {
        fields: this.tokens(i.fields),
        stage: i.stages, // 机构是多阶段，保留原串，匹配时再拆
        amount: i.amountMax,
        city: i.city
      }
    }
    if (dto.field) base.fields = this.tokens(dto.field)
    if (dto.stage) base.stage = dto.stage
    if (typeof dto.amount === 'number') base.amount = dto.amount
    if (dto.city) base.city = dto.city
    return base
  }
}
