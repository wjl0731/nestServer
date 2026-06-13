import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

/** 投资机构（投资方） */
@Entity('institution')
export class Institution {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ length: 100 })
  name!: string

  @Column({ length: 50, default: '' })
  type!: string

  /** 投资领域，多个以 / 分隔，如「人工智能/企业服务」 */
  @Index()
  @Column({ length: 200, default: '' })
  fields!: string

  /** 投资阶段，多个以 / 分隔，如「天使轮/Pre-A」 */
  @Column({ length: 100, default: '' })
  stages!: string

  /** 单笔投资额区间（万元） */
  @Column({ type: 'int', default: 0 })
  amountMin!: number

  @Column({ type: 'int', default: 0 })
  amountMax!: number

  @Index()
  @Column({ length: 50, default: '' })
  city!: string

  @Column({ length: 255, default: '' })
  preference!: string

  @Column({ length: 50, default: '' })
  contact!: string

  @Column({ length: 50, default: '' })
  phone!: string
}
