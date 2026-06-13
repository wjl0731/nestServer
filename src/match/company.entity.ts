import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

/** 项目方公司（融资方） */
@Entity('company')
export class Company {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ length: 100 })
  name!: string

  /** 所属领域，多个以 / 分隔 */
  @Index()
  @Column({ length: 100, default: '' })
  field!: string

  @Column({ type: 'int', default: 0 })
  foundedYear!: number

  @Index()
  @Column({ length: 50, default: '' })
  city!: string

  /** 融资阶段，如「天使轮」 */
  @Column({ length: 50, default: '' })
  stage!: string

  /** 本轮融资需求（万元） */
  @Column({ type: 'int', default: 0 })
  fundingNeed!: number

  /** 当前估值（万元） */
  @Column({ type: 'int', default: 0 })
  valuation!: number

  @Column({ type: 'int', default: 0 })
  teamSize!: number

  @Column({ length: 255, default: '' })
  business!: string

  @Column({ length: 50, default: '' })
  contact!: string

  @Column({ length: 50, default: '' })
  phone!: string
}
