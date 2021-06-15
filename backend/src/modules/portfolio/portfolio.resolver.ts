import { Args, Field, InputType, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { mapStoreToPublicPortfolio, PortfolioService } from './portfolio.service';
import { GraphQLFloat, GraphQLString } from 'graphql';
import { User } from '../user/types';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/auth-guard-jwt-gql';
import { CurrentGqlUser } from '../auth/current-gql-user.decorator';
import { CorrelationId } from '@common/correlation-id.decorator';

@ObjectType()
export class PortfolioDescription {
  @Field(() => GraphQLString)
  id: string;

  @Field(() => GraphQLString)
  name: string;

  @Field(() => GraphQLString, { nullable: true })
  description: string;
}

@InputType()
export class InputCreatePortfolio {
  @Field(() => GraphQLString)
  name: string;

  @Field(() => GraphQLString, { nullable: true })
  description: string;
}

@InputType()
export class InputAddSubscriberToPortfolio {
  @Field(() => GraphQLString)
  userId: string;

  @Field(() => GraphQLString)
  portfolioId: string;
}

@InputType()
export class InputPortfolioBreakdown {
  @Field(() => GraphQLString)
  portfolioId: string;
}

@ObjectType()
export class PortfolioStake {
  @Field(() => GraphQLString)
  stakeholder: string;

  @Field(() => GraphQLFloat)
  percentage: number;
}

@InputType()
export class PortfolioAdjustment {
  @Field(() => GraphQLString)
  portfolioId: string;

  @Field(() => GraphQLString, { description: 'User whose stake is being adjusted' })
  userId: string;

  @Field(() => GraphQLFloat)
  currentPortfolioValue: number;

  @Field(() => GraphQLFloat)
  cashUpdate: number; // Can be negative
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
  async createPortfolio(@Args('params') params: InputCreatePortfolio, @CurrentGqlUser() user: User) {
    const portfolio = await this.portfolioService.createPortfolio(params, user)
    return portfolio;
  }

  @Mutation(returns => Boolean!, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async addSubscriberToPortfolio(@Args('params') params: InputAddSubscriberToPortfolio, @CurrentGqlUser() user: User) {
    await this.portfolioService.addSubscriberToPortfolio(params, user)
  }

  @Query(returns => [PortfolioDescription])
  getPortfoliosManagedByUser() {
    // this.portfolioService.getPortfoliosManagedByUser();
  }

  @Query(returns => [PortfolioDescription])
  getPortfoliosSubscribedByUser() {
    // this.portfolioService.getPortfoliosSubscribedByUser();
  }

  @Mutation(returns => [PortfolioStake], { description: Descriptions.adjustPortfolio })
  @UseGuards(GqlAuthGuard)
  adjustPortfolio(@Args('params') params: PortfolioAdjustment, @CurrentGqlUser() user: User, @CorrelationId() correlationId) {
    console.info({ correlationId, user }, 'adjustPortfolio')
    return this.portfolioService.adjustPortfolio(params, user);
  }

  @Query(returns => [PortfolioStake])
  @UseGuards(GqlAuthGuard)
  getPortfolioBreakdown(@Args('params') params: InputPortfolioBreakdown, @CurrentGqlUser() user: User) {
    console.info({ user }, 'getPortfolioBreakdown')
    return this.portfolioService.getPortfolioBreakdown(params, user);
  }
}
