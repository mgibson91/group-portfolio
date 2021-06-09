import { Args, Field, InputType, Mutation, ObjectType, Resolver } from '@nestjs/graphql';
import { GqlLocalAuthGuard } from 'src/auth/auth-guard-local-gql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { GraphQLString } from 'graphql';
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
  async createUser(@Args("params") params: InputRegister) {
    await this.userService.create(params);
    return this.authService.login({
      email: params.email,
      password: params.password,
    });
  }
}
