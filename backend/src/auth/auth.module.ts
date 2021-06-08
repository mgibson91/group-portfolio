import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { UserService } from '../user/user.service';
import { UserModel, UserSchema } from '../user/user.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    forwardRef(() => UserModule),
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '24h' },
    }),
    // Sigh - This in an unfortunate inclusion
    MongooseModule.forFeature([
      { name: UserModel.name, schema: UserSchema, collection: 'users' }
    ])
  ],
  providers: [AuthService, LocalStrategy, UserService, JwtStrategy, UserModel],
  exports: [AuthService],
})
export class AuthModule {}
