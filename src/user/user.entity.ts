import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm'

export type Gender = 'male' | 'female' | 'unknown'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 128 })
  email: string

  @Column({ type: 'varchar', length: 255, select: false })
  password: string

  @Column({ type: 'varchar', length: 16, default: 'unknown' })
  gender: Gender

  @Column({ type: 'varchar', length: 255, default: '' })
  signature: string

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date
}
