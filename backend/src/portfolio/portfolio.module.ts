import { Module } from '@nestjs/common';
import { PortfolioResolver } from './portfolio.resolver';
import { PortfolioService } from './portfolio.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModel, UserSchema } from '../user/user.schema';
import { PortfolioModel, PortfolioSchema } from './portfolio.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PortfolioModel.name, schema: PortfolioSchema, collection: 'portfolios' }
    ]),
  ],
  providers: [
    PortfolioResolver,
    PortfolioService,
  ]
})
export class PortfolioModule {}
