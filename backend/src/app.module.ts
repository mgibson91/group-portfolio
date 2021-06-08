import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { PortfolioModule } from './portfolio/portfolio.module';
import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    UserModule,
    PortfolioModule,
    GraphQLModule.forRoot({
      autoSchemaFile: true,
    }),
    MongooseModule.forRoot('mongodb://localhost:37017', {
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true,
    }),
    // MongooseModule.forFeature([
    //   { name: UserModel.name, schema: UserSchema, collection: 'users' }
    // ])
  ],
})
export class AppModule {}
