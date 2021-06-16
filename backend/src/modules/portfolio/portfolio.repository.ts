import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Collection, MongoClient } from 'mongodb';
import { Model } from '../../index';
import { CustomProviders } from '@common/nest-common';
import { Collections } from '@common/collections';

@Injectable()
export class PortfolioRepository {
  private portfolioCollection: Collection<Model.Portfolio.Store>;
  private portfolioSubscriberCollection: Collection<Model.PortfolioSubscriber.Store>;

  constructor(@Inject(CustomProviders.MONGO_CLIENT) private mongoClient: MongoClient) {
    this.portfolioCollection = this.mongoClient.db().collection<Model.Portfolio.Store>(Collections.Portfolio);
    this.portfolioSubscriberCollection = this.mongoClient.db().collection<Model.PortfolioSubscriber.Store>(Collections.PortfolioSubscriber);
  }

  async getExistingPortfolio(portfolioId: string) {
    const portfolio = await this.portfolioCollection.findOne({ _id: portfolioId });
    if (!portfolio) {
      console.error({ portfolioId }, 'Portfolio does not exist')
      throw new NotFoundException('Portfolio does not exist');
    }

    return portfolio;
  }

  async getPersonalPortfolios(userId: string) {
    const subscriptionsCursor = await this.portfolioSubscriberCollection.find({ userId });
    const subscriptions = await subscriptionsCursor.toArray();
    const portfolioIds = subscriptions.map(p => p.portfolioId);

    const portfoliosCursor = await this.portfolioCollection.find({ _id: { $in: portfolioIds }});
    const portfolios = await portfoliosCursor.toArray();

    return portfolios;
  }

  async create(portfolio: Model.Portfolio.Store){
    const result = await this.portfolioCollection.insertOne(portfolio);
    const found = await this.portfolioCollection.findOne({ _id: result.insertedId })
    if (!found) {
      console.error({ portfolio }, 'Unable to create portfolio')
      throw new InternalServerErrorException('Portfolio not created');
    }

    return found;
  }

  async updateBreakdown(portfolioId: string, breakdown: Record<string, number>) {
    await this.portfolioCollection.updateOne({
      _id: portfolioId
    }, {
      $set: {
        breakdown,
      }
    });

    const updated = await this.getExistingPortfolio(portfolioId);
    return updated;
  }

  async updateValue({ portfolioId, value }: { portfolioId: string, value: number }) {
    await this.portfolioCollection.updateOne({
      _id: portfolioId
    }, {
      $set: {
        value,
      }
    });

    const updated = await this.getExistingPortfolio(portfolioId);
    return updated;
  }

  async addSubscriberToPortfolio(params: { portfolioId: string, userId: string }) {
    await this.portfolioSubscriberCollection.insertOne(params);
  }
}
