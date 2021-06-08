import { Args, Field, InputType, Mutation, ObjectType, Resolver } from '@nestjs/graphql';
import { GqlLocalAuthGuard } from 'src/auth/auth-guard-local-gql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { GqlJwtAuthGuard } from '../auth/auth-guard-jwt-gql';
import { GraphQLString } from 'graphql';
import { CurrentGqlUser } from '../auth/current-gql-user.decorator';
import { User } from './types';
import { UserService } from './user.service';

@ObjectType()
export class Session {
  @Field(() => GraphQLString)
  access_token: string;
}

@InputType()
export class InputLoginCredentials {
  @Field(() => GraphQLString)
  email: string;

  @Field(() => GraphQLString)
  password: string;
}

@InputType()
export class InputRegister {
  @Field(() => GraphQLString)
  email: string;

  @Field(() => GraphQLString)
  username: string;

  @Field(() => GraphQLString)
  password: string;
}

@Resolver()
export class UserResolver {
  constructor(private authService: AuthService, private userService: UserService) {}

  @Mutation(() => Session)
  @UseGuards(GqlLocalAuthGuard)
  async login(@Args("credentials") credentials: InputLoginCredentials) {
    return this.authService.login(credentials);
  }

  @Mutation(() => Session)
  // @UseGuards(GqlLocalAuthGuard)
  async createUser(@Args("params") params: InputRegister) {
    await this.userService.create(params);
    return this.authService.login({
      email: params.email,
      password: params.password,
    });


    return { access_token: '#' };
  }

  @Mutation(() => Session)
  @UseGuards(GqlJwtAuthGuard)
  async doProtectedAction(@CurrentGqlUser() user: User) {
    console.log(`User: ${JSON.stringify(user)}`);
    return { access_token: 'yea' };
  }

  // @UseGuards(LocalAuthGuard)
  // @Post('auth/login')
  // async login(@Request() req) {
  //   return this.authService.login(req.user);
  // }

  // @UseGuards(JwtAuthGuard)
  // @Get('profile')
  // getProfile(@Request() req) {
  //   return req.user;
  // }
}
