import { Module } from '@nestjs/common';
import { PortfolioResolver } from './portfolio.resolver';
import { PortfolioService } from './portfolio.service';
import { MONGO_PROVIDER } from '../mongo/mongo.provider';

@Module({
  imports: [

  ],
  providers: [
    PortfolioResolver,
    PortfolioService,
    MONGO_PROVIDER,
  ]
})
export class PortfolioModule {}
