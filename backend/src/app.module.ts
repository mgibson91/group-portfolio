import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    PortfolioModule,
    GraphQLModule.forRoot({
      autoSchemaFile: true,
      playground: true,
    }),
  ],
  providers: [],
})
export class AppModule {}
