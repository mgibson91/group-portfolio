import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Collection, MongoClient } from 'mongodb';
import { Model } from '../../index';
import { CustomProviders } from '@common/nest-common';
import { Collections } from '@common/collections';

@Injectable()
export class UserRepository {
  private userCollection: Collection<Model.User.Store>;

  constructor(@Inject(CustomProviders.MONGO_CLIENT) private mongoClient: MongoClient) {
    this.userCollection = this.mongoClient.db().collection<Model.User.Store>(Collections.User);
  }

  async getExistingUser(userId: string) {
    const user = await this.userCollection.findOne({ _id: userId });
    if (!user) {
      console.error({ userId }, 'Portfolio does not exist')
      throw new NotFoundException('User does not exist');
    }

    return user;
  }
}
