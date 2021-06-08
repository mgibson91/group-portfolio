import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { AuthModule } from '../auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModel, UserSchema } from './user.schema';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    MongooseModule.forFeature([
      { name: UserModel.name, schema: UserSchema, collection: 'users' }
    ])
  ],
  providers: [UserService, UserResolver],
  exports: [UserService],
})
export class UserModule {}
