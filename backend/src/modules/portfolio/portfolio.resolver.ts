import { Args, Field, InputType, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { mapStoreToPublicPortfolio, PortfolioService } from './portfolio.service';
import { GraphQLFloat, GraphQLString } from 'graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/auth-guard-jwt-gql';
import { CurrentGqlUser } from '../auth/current-gql-user.decorator';
import { CorrelationId } from '@common/correlation-id.decorator';
import { Model } from '../../index';

@ObjectType()
export class PortfolioDescription {
  @Field(() => GraphQLString)
  id!: string;

  @Field(() => GraphQLString)
  name!: string;

  @Field(() => GraphQLString, { nullable: true })
  description?: string;

  @Field(() => GraphQLFloat, { defaultValue: 0 })
  value!: number;
}

@InputType()
export class InputCreatePortfolio {
  @Field(() => GraphQLString)
  name!: string;

  @Field(() => GraphQLString, { nullable: true })
  description?: string;
}

@InputType()
export class InputAddSubscriberToPortfolio {
  @Field(() => GraphQLString)
  userId!: string;

  @Field(() => GraphQLString)
  portfolioId!: string;
}

@InputType()
export class InputPortfolioBreakdown {
  @Field(() => GraphQLString)
  portfolioId!: string;
}

@ObjectType()
export class PortfolioStake {
  @Field(() => GraphQLString)
  stakeholder!: string;

  @Field(() => GraphQLFloat)
  percentage!: number;

  @Field(() => GraphQLFloat)
  value!: number;
}

@ObjectType()
export class PersonalStake {
  @Field(() => GraphQLString)
  portfolio!: PortfolioDescription;

  @Field(() => GraphQLFloat)
  percentage!: number;
}

@InputType()
export class InputAdjustPortfolio {
  @Field(() => GraphQLString)
  portfolioId!: string;

  @Field(() => GraphQLString, { description: 'User whose stake is being adjusted' })
  userId!: string;

  @Field(() => GraphQLFloat)
  currentPortfolioValue!: number;

  @Field(() => GraphQLFloat)
  cashUpdate!: number; // Can be negative
}

@InputType()
export class InputUpdatePortfolioValue {
  @Field(() => GraphQLString)
  portfolioId!: string;

  @Field(() => GraphQLFloat)
  value!: number;
}

const Descriptions = {
  adjustPortfolio: 'Allows manager to adjust stake of any user. ' +
    'Adding a stake for an unsubscribed user will subscribe them to portfolio'
}

@Resolver()
export class PortfolioResolver {
  constructor(private portfolioService: PortfolioService) {}

  @Mutation(returns => PortfolioDescription)
  @UseGuards(GqlAuthGuard)
  async createPortfolio(@Args('params') params: InputCreatePortfolio, @CurrentGqlUser() user: Model.User.Public, @CorrelationId() correlationId: string) {
    const portfolio = await this.portfolioService.createPortfolio(params, user)
    return portfolio;
  }

  @Mutation(returns => Boolean!, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async addSubscriberToPortfolio(@Args('params') params: InputAddSubscriberToPortfolio, @CurrentGqlUser() user: Model.User.Public, @CorrelationId() correlationId: string) {
    await this.portfolioService.addSubscriberToPortfolio(params, user)
  }

  // @Query(returns => [PortfolioDescription])
  // getPortfoliosManagedByUser() {
  //   // this.portfolioService.getPortfoliosManagedByUser();
  // }

  @Mutation(returns => [PortfolioStake], { description: Descriptions.adjustPortfolio })
  @UseGuards(GqlAuthGuard)
  adjustPortfolio(@Args('params') params: InputAdjustPortfolio, @CurrentGqlUser() user: Model.User.Public, @CorrelationId() correlationId: string) {
    console.info({ correlationId, userId: user.id }, 'adjustPortfolio')
    return this.portfolioService.adjustPortfolio(params, user);
  }

  @Mutation(returns => [PortfolioStake], { description: Descriptions.adjustPortfolio })
  @UseGuards(GqlAuthGuard)
  updatePortfolioValue(@Args('params') params: InputUpdatePortfolioValue, @CurrentGqlUser() user: Model.User.Public, @CorrelationId() correlationId: string) {
    console.info({ correlationId, userId: user.id }, 'updatePortfolioValue')
    return this.portfolioService.updateValue(params, user);
  }

  @Query(returns => [PortfolioStake])
  @UseGuards(GqlAuthGuard)
  getPortfolioBreakdown(@Args('params') params: InputPortfolioBreakdown, @CurrentGqlUser() user: Model.User.Public, @CorrelationId() correlationId: string) {
    console.info({ userId: user.id }, 'getPortfolioBreakdown')
    return this.portfolioService.getPortfolioBreakdown(params, user);
  }

  @Query(returns => [PersonalStake])
  @UseGuards(GqlAuthGuard)
  getPersonalBreakdown(@CurrentGqlUser() user: Model.User.Public, @CorrelationId() correlationId: string) {
    console.info({ userId: user.id }, 'getPersonalBreakdown')
    return this.portfolioService.getPersonalBreakdown(user);
  }
}
