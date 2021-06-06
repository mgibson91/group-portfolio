import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { PortfolioModule } from './portfolio/portfolio.module';
import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModel, UserSchema } from './schemas/user';

@Module({
  imports: [
    UserModule,
    PortfolioModule,
    GraphQLModule.forRoot({
      autoSchemaFile: true,
    }),
    MongooseModule.forRoot('mongodb://localhost/nest'),
    // MongooseModule.forFeature([
    //   { name: UserModel.name, schema: UserSchema, collection: 'users' }
    // ])
  ],
})
export class AppModule {}
