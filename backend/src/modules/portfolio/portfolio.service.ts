import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  InputAddSubscriberToPortfolio,
  InputAdjustPortfolio,
  InputCreatePortfolio,
  InputPortfolioBreakdown,
  InputUpdatePortfolioValue,
  PersonalStake,
  PortfolioStake,
} from './portfolio.resolver';
import { Model } from '../../index';
import { PortfolioRepository } from './portfolio.repository';
import { v4 as uuid } from 'uuid';
import { UserRepository } from '../user/user.repository';

function mapPortfolioBreakdown(portfolio: Model.Portfolio.Store): PortfolioStake[] {
  return Object.entries(portfolio?.breakdown).map(([stakeholder, fraction]) => {
    const percentage = fraction * 100;
    return {
      stakeholder,
      percentage,
      value: portfolio.value * fraction,
    }
  });
}

export function mapStoreToPublicPortfolio(model: Model.Portfolio.Store): Model.Portfolio.Public {
  return {
    id: model._id,
    createdBy: model.createdBy,
    name: model.name,
    description: model.description,
    value: model.value,
    breakdown: model.breakdown,
  };
}

@Injectable()
export class PortfolioService {
  constructor(
    private portfolioRepo: PortfolioRepository,
    private userRepo: UserRepository,
  ) {

  }

  private async verifyPortfolioCreatedByUser(portfolio: Model.Portfolio.Store, user: Model.User.Public) {
    if (portfolio?.createdBy !== user.id) {
      console.error({ portfolioId: portfolio._id, requestingUserId: user.id }, 'Portfolio can only be updated by the user who created it')
      throw new UnauthorizedException('Portfolio can only be updated by the user who created it')
    }
  }

  // private async getPersonalPortfolios(userId: string) {
  //   const subscriptionsCursor = await this.portfolioSubscriberCollection.find({ userId });
  //   const subscriptions = await subscriptionsCursor.toArray();
  //   const portfolioIds = subscriptions.map(p => p.portfolioId);
  //
  //   const portfoliosCursor = await this.portfolioCollection.find({ _id: { $in: portfolioIds }});
  //   const portfolios = await portfoliosCursor.toArray();
  //
  //   return portfolios;
  // }

  async createPortfolio(params: InputCreatePortfolio, requestingUser: Model.User.Public): Promise<Model.Portfolio.Public> {
    const portfolio = await this.portfolioRepo.create({ ...params, _id: uuid(), createdBy: requestingUser.id, value: 0, breakdown: {} });
    return mapStoreToPublicPortfolio(portfolio);
  }

  async addSubscriberToPortfolio(params: InputAddSubscriberToPortfolio, requestingUser: Model.User.Public): Promise<void> {
    const portfolio = await this.portfolioRepo.getExistingPortfolio(params.portfolioId);
    await this.verifyPortfolioCreatedByUser(portfolio, requestingUser);

    const user = await this.userRepo.getExistingUser(params.userId);

    await this.portfolioRepo.addSubscriberToPortfolio({
      portfolioId: portfolio._id,
      userId: user._id,
    });
  }

  async adjustPortfolio(params: InputAdjustPortfolio, requestingUser: Model.User.Public) {
    const portfolio = await this.portfolioRepo.getExistingPortfolio(params.portfolioId);
    await this.verifyPortfolioCreatedByUser(portfolio, requestingUser);

    if (!portfolio.breakdown) {
      portfolio.breakdown = {};
    }

    const stakeholderExists = Object.prototype.hasOwnProperty.call(portfolio.breakdown, params.userId);
    if (!stakeholderExists) {
      if (params.cashUpdate < 0) {
        throw new Error(`Investment stakeholder ${params.userId} does not exist. Unable to reduce stake`);
      }

      // Otherwise, add new stakeholder
      portfolio.breakdown[params.userId] = 0;
    }

    const currentClientStake = portfolio.breakdown[params.userId] * params.currentPortfolioValue;

    // If adding investment, add directly
    // If removing investment, ensure removal is not greater than existing investment
    const adjustedCashUpdate = params.cashUpdate > 0 ? params.cashUpdate : Math.max(-1 * currentClientStake, params.cashUpdate);
    const newClientStake = currentClientStake + adjustedCashUpdate;

    const newTotalPortfolio = params.currentPortfolioValue + adjustedCashUpdate;

    // Updating client portfolio fraction
    const updatedClientFraction = newClientStake / newTotalPortfolio;
    portfolio.breakdown[params.userId] = Number.isNaN(updatedClientFraction) ? 0 : updatedClientFraction;

    for (const [ stakeholder, currentFraction ] of Object.entries(portfolio.breakdown)) {
      if (stakeholder === params.userId) {
        continue;
      }

      const currentStake = params.currentPortfolioValue * (currentFraction as number);
      const newFraction = currentStake / newTotalPortfolio;
      portfolio.breakdown[stakeholder] = newFraction;
    }

    await this.portfolioRepo.updateBreakdown(portfolio._id, portfolio.breakdown);

    return mapPortfolioBreakdown(portfolio);
  }

  async getPortfolioBreakdown(params: InputPortfolioBreakdown, requestingUser: Model.User.Public) {
    const portfolio = await this.portfolioRepo.getExistingPortfolio(params.portfolioId);
    await this.verifyPortfolioCreatedByUser(portfolio, requestingUser);

    return mapPortfolioBreakdown(portfolio);
  }

  async getPersonalBreakdown(requestingUser: Model.User.Public) {
    const portfolios = await this.portfolioRepo.getPersonalPortfolios(requestingUser.id);

    const result: PersonalStake[] = [];

    for (const portfolio of portfolios) {
      const percentage = portfolio.breakdown?.[requestingUser.id];
      if (percentage) {
        result.push({ percentage, portfolio: mapStoreToPublicPortfolio(portfolio) })
      }
    }

    return result;
  }

  async updateValue(params: InputUpdatePortfolioValue, requestingUser: Model.User.Public) {
    const portfolio = await this.portfolioRepo.getExistingPortfolio(params.portfolioId);
    await this.verifyPortfolioCreatedByUser(portfolio, requestingUser);

    const updated = await this.portfolioRepo.updateValue(params);
    return mapPortfolioBreakdown(updated);
  }
}
