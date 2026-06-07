import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UpdateUserInfoDto } from './dto/user.dto'
import { User } from './user.entity'

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  async getInfo(userId: string) {
    const user = await this.repo.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException('用户不存在')
    return {
      id: user.id,
      email: user.email,
      gender: user.gender,
      signature: user.signature
    }
  }

  async updateInfo(userId: string, dto: UpdateUserInfoDto) {
    const user = await this.repo.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException('用户不存在')

    if (dto.gender !== undefined) user.gender = dto.gender
    if (dto.signature !== undefined) user.signature = dto.signature

    await this.repo.save(user)
    return {
      id: user.id,
      email: user.email,
      gender: user.gender,
      signature: user.signature
    }
  }
}
