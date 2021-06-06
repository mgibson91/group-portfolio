import { Module } from '@nestjs/common';
import { PortfolioResolver } from './portfolio.resolver';
import { PortfolioService } from './portfolio.service';

@Module({
  providers: [
    PortfolioResolver,
    PortfolioService,
  ]
})
export class PortfolioModule {}
