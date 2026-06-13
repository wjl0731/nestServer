import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Institution } from './institution.entity'
import { Company } from './company.entity'
import { MatchService } from './match.service'
import { MatchController } from './match.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Institution, Company])],
  controllers: [MatchController],
  providers: [MatchService],
  exports: [MatchService]
})
export class MatchModule {}
