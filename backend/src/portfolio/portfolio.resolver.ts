import { Args, Field, InputType, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { PortfolioService } from './portfolio.service';

@ObjectType()
export class PortfolioStake {
  @Field()
  stakeholder: string;

  @Field()
  percentage: number;
}

@InputType()
export class PortfolioAdjustment {
  @Field()
  stakeholder: string;

  @Field()
  currentPortfolioValue: number;

  @Field()
  cashUpdate: number; // Can be negative
}

@Resolver()
export class PortfolioResolver {
  constructor(private portfolioService: PortfolioService) {}

  @Mutation(returns => [PortfolioStake])
  adjustPortfolio(@Args('params') params: PortfolioAdjustment) {
    return this.portfolioService.adjustPortfolio(params);
  }

  @Query(returns => [PortfolioStake])
  getPortfolioBreakdown() {
    return this.portfolioService.getPortfolioBreakdown();
  }
}
