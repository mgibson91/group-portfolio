import { Module } from '@nestjs/common';
import { PortfolioResolver } from './portfolio.resolver';
import { PortfolioService } from './portfolio.service';
import { MONGO_PROVIDER } from '../mongo/mongo.provider';
import { PortfolioRepository } from './portfolio.repository';
import { UserRepository } from '../user/user.repository';

@Module({
  imports: [

  ],
  providers: [
    PortfolioResolver,
    PortfolioService,
    MONGO_PROVIDER,
    PortfolioRepository,
    UserRepository,
  ],
  exports: [
    PortfolioService,
    PortfolioRepository,
  ]
})
export class PortfolioModule {}
