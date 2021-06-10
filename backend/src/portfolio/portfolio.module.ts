import { Module } from '@nestjs/common';
import { PortfolioResolver } from './portfolio.resolver';
import { PortfolioService } from './portfolio.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PortfolioModel, PortfolioSchema } from './portfolio.schema';
import { PortfolioSubscribersModel, PortfolioSubscribersSchema } from './portfolio-subscribers.schema';
import { UserModel, UserSchema } from '../user/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserModel.name, schema: UserSchema, collection: 'users' },
      { name: PortfolioModel.name, schema: PortfolioSchema, collection: 'portfolios' },
      { name: PortfolioSubscribersModel.name, schema: PortfolioSubscribersSchema, collection: 'portfolio-subscribers' }
    ]),
  ],
  providers: [
    PortfolioResolver,
    PortfolioService,
  ]
})
export class PortfolioModule {}
