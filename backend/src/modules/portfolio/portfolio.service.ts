import { Inject, Injectable } from '@nestjs/common';
import {
  InputAddSubscriberToPortfolio,
  InputCreatePortfolio, InputPortfolioBreakdown,
  PortfolioAdjustment,
  PortfolioStake,
} from './portfolio.resolver';
import { User } from '../user/types';
import { CustomProviders } from '@common/nest-common';
import { Collection, MongoClient } from 'mongodb';
import { Collections } from '@common/collections';
import { Model } from '../../index';
import { v4 as uuid } from "uuid";


function mapPortfolioBreakdown(breakdown: Record<string, number>): PortfolioStake[] {
  return Object.entries(breakdown).map(([stakeholder, fraction]) => ({ stakeholder, percentage: fraction * 100 }));
}

export function mapStoreToPublicPortfolio(model: Model.Portfolio.Store): Model.Portfolio.Public {
  return {
    id: model._id,
    createdBy: model.createdBy,
    name: model.name,
    description: model.description,
    breakdown: model.breakdown,
  };
}

@Injectable()
export class PortfolioService {
  private userCollection: Collection<Model.User.Store>;
  private portfolioCollection: Collection<Model.Portfolio.Store>;
  private portfolioSubscriberCollection: Collection<Model.PortfolioSubscriber.Store>;

  // private breakdown: Record<string, number> = {};

  constructor(@Inject(CustomProviders.MONGO_CLIENT) private mongoClient: MongoClient) {
    this.userCollection = this.mongoClient.db().collection<Model.User.Store>(Collections.User);
    this.portfolioCollection = this.mongoClient.db().collection<Model.Portfolio.Store>(Collections.Portfolio);
    this.portfolioSubscriberCollection = this.mongoClient.db().collection<Model.PortfolioSubscriber.Store>(Collections.PortfolioSubscriber);
  }

  public async createPortfolio(params: InputCreatePortfolio, requestingUser: User): Promise<Model.Portfolio.Public> {
    const result = await this.portfolioCollection.insertOne({ ...params, _id: uuid(), createdBy: requestingUser.id, breakdown: {} });
    const found = await this.portfolioCollection.findOne({ _id: result.insertedId })

    return mapStoreToPublicPortfolio(found);
  }

  public async addSubscriberToPortfolio(params: InputAddSubscriberToPortfolio, requestingUser: User): Promise<void> {
    const portfolio = await this.portfolioCollection.findOne({ _id: params.portfolioId });
    if (!portfolio) {
      throw new Error('Portfolio does not exist');
    }

    if (portfolio?.createdBy !== requestingUser.id) {
      throw new Error('Portfolio can only be updated by the user who created it')
    }

    const user = await this.userCollection.findOne({ _id: params.userId });
    if (!user) {
      throw new Error('User does not exist');
    }

    const subscription = await this.portfolioSubscriberCollection.insertOne(params);
  }

  public async adjustPortfolio(params: PortfolioAdjustment, requestingUser: User) {
    const portfolio = await this.portfolioCollection.findOne({ _id: params.portfolioId });
    if (!portfolio) {
      throw new Error('Portfolio does not exist');
    }

    if (portfolio?.createdBy !== requestingUser.id) {
      console.error({ portfolioId: portfolio._id, requestingUserId: requestingUser.id }, 'Portfolio can only be updated by the user who created it')
      throw new Error('Portfolio can only be updated by the user who created it')
    }

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

      const currentStake = params.currentPortfolioValue * currentFraction;
      const newFraction = currentStake / newTotalPortfolio;
      portfolio.breakdown[stakeholder] = newFraction;
    }

    await this.portfolioCollection.updateOne({
      _id: params.portfolioId
    }, {
      $set: {
        breakdown: portfolio.breakdown,
      }
    });

    return mapPortfolioBreakdown(portfolio.breakdown);
  }

  public async getPortfolioBreakdown(params: InputPortfolioBreakdown, requestingUser: User) {
    const portfolio = await this.portfolioCollection.findOne({ _id: params.portfolioId });
    if (portfolio?.createdBy !== requestingUser?.id) {
      console.error({ portfolioId: portfolio._id, requestingUserId: requestingUser?.id }, 'Portfolio can only be updated by the user who created it')
      throw new Error('Portfolio can only be queried by the user who created it')
    }

    return mapPortfolioBreakdown(portfolio?.breakdown);
  }
}
