import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { AuthModule } from '../auth/auth.module';
import { MONGO_PROVIDER } from '../mongo/mongo.provider';

@Module({
  imports: [
    forwardRef(() => AuthModule),
  ],
  providers: [
    UserService,
    UserResolver,
    MONGO_PROVIDER,
  ],
  exports: [
    UserService,
    UserResolver,
  ],
})
export class UserModule {
}
