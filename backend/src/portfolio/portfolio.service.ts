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

  public adjustPortfolio(update: PortfolioAdjustment) {
    const stakeholderExists = Object.prototype.hasOwnProperty.call(this.breakdown, update.stakeholder);

    if (!stakeholderExists) {
      if (update.cashUpdate < 0) {
        throw new Error(`Investment stakeholder ${update.stakeholder} does not exist. Unable to reduce stake`);
      }

      // Otherwise, add new stakeholder
      this.breakdown[update.stakeholder] = 0;
    }

    const currentClientStake = this.breakdown[update.stakeholder] * update.currentPortfolioValue;

    // If adding investment, add directly
    // If removing investment, ensure removal is not greater than existing investment
    const adjustedCashUpdate = update.cashUpdate > 0 ? update.cashUpdate : Math.max(-1 * currentClientStake, update.cashUpdate);
    const newClientStake = currentClientStake + adjustedCashUpdate;

    const newTotalPortfolio = update.currentPortfolioValue + adjustedCashUpdate;

    // Updating client portfolio fraction
    const updatedClientFraction = newClientStake / newTotalPortfolio;
    this.breakdown[update.stakeholder] = updatedClientFraction;

    for (const [ stakeholder, currentFraction ] of Object.entries(this.breakdown)) {
      if (stakeholder === update.stakeholder) {
        continue;
      }

      const currentStake = update.currentPortfolioValue * currentFraction;
      const newFraction = currentStake / newTotalPortfolio;
      this.breakdown[stakeholder] = newFraction;
    }

    return this.getPortfolioBreakdown();
  }

  public getPortfolioBreakdown(): PortfolioStake[] {
    return Object.entries(this.breakdown).map(([stakeholder, fraction]) => ({ stakeholder, percentage: fraction * 100 }));
  }
}
