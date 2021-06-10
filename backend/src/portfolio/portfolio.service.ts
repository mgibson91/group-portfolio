import { Injectable } from '@nestjs/common';
import {
  InputAddSubscriberToPortfolio,
  InputCreatePortfolio,
  PortfolioAdjustment,
  PortfolioStake,
} from './portfolio.resolver';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PortfolioDocument, PortfolioModel } from './portfolio.schema';
import { PortfolioSubscribersDocument, PortfolioSubscribersModel } from './portfolio-subscribers.schema';
import { CurrentGqlUser } from '../auth/current-gql-user.decorator';
import { User } from '../user/types';
import { UserDocument, UserModel } from '../user/user.schema';

function getPortfolioBreakdown(breakdown: Record<string, number>): PortfolioStake[] {
  return Object.entries(breakdown).map(([stakeholder, fraction]) => ({ stakeholder, percentage: fraction * 100 }));
}

@Injectable()
export class PortfolioService {
  private breakdown: Record<string, number> = {};

  constructor(
    @InjectModel(UserModel.name) private userModel: Model<UserDocument>,
    @InjectModel(PortfolioModel.name) private portfolioModel: Model<PortfolioDocument>,
    @InjectModel(PortfolioSubscribersModel.name) private portfolioSubscribersModel: Model<PortfolioSubscribersDocument>,
  ) {}

  public async createPortfolio(params: InputCreatePortfolio, requestingUser: User): Promise<PortfolioDocument> {
    const created = new this.portfolioModel({ ...params, createdBy: requestingUser.id });
    return created.save();
  }

  public async addSubscriberToPortfolio(params: InputAddSubscriberToPortfolio, requestingUser: User): Promise<void> {
    const portfolio = await this.portfolioModel.findOne({ _id: params.portfolioId }).lean();
    if (!portfolio) {
      throw new Error('Portfolio does not exist');
    }

    if (portfolio?.createdBy !== requestingUser.id) {
      throw new Error('Portfolio can only be updated by the user who created it')
    }

    const user = await this.userModel.findOne({ _id: params.userId }).lean();
    if (!user) {
      throw new Error('User does not exist');
    }

    const subscription = new this.portfolioSubscribersModel(params);
    await subscription.save();
  }

  public async adjustPortfolio(params: PortfolioAdjustment, requestingUser: User) {
    const portfolio = await this.portfolioModel.findOne({ _id: params.portfolioId }).lean();
    if (!portfolio) {
      throw new Error('Portfolio does not exist');
    }

    if (portfolio?.createdBy !== requestingUser.id) {
      throw new Error('Portfolio can only be updated by the user who created it')
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
    portfolio.breakdown[params.userId] = updatedClientFraction;

    for (const [ stakeholder, currentFraction ] of Object.entries(portfolio.breakdown)) {
      if (stakeholder === params.userId) {
        continue;
      }

      const currentStake = params.currentPortfolioValue * currentFraction;
      const newFraction = currentStake / newTotalPortfolio;
      portfolio.breakdown[stakeholder] = newFraction;
    }

    await this.portfolioModel.updateOne({
      _id: params.portfolioId
    }, {
      $set: {
        breakdown: portfolio.breakdown,
      }
    });

    return getPortfolioBreakdown(portfolio.breakdown);
  }

  public getPortfolioBreakdown(): PortfolioStake[] {
    return Object.entries(this.breakdown).map(([stakeholder, fraction]) => ({ stakeholder, percentage: fraction * 100 }));
  }
}
