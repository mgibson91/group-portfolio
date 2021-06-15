import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './types';
import { hashPassword } from '@common/password-utils';
import { Model } from '../../index';
import { CustomProviders } from '@common/nest-common';
import { Collection, MongoClient } from 'mongodb';
import { Collections } from '@common/collections';
import { v4 as uuid } from "uuid";

export function mapStoreToPublicUser(store: Model.User.Store): Model.User.Public {
  return {
    id: store._id,
    username: store.username,
    email: store.email,
  };
}

@Injectable()
export class UserService {
  private userCollection: Collection<Model.User.Store>;

  constructor(@Inject(CustomProviders.MONGO_CLIENT) private mongoClient: MongoClient) {
    this.userCollection = this.mongoClient.db().collection<Model.User.Store>(Collections.User);
  }

  async create(createUserDto: CreateUserDto): Promise<Model.User.Public> {
    const passwordHash = await hashPassword(createUserDto.password);
    const { password, ...createArgs } = createUserDto;

    const result = await this.userCollection.insertOne({ ...createArgs, _id: uuid(), passwordHash });
    const found = await this.userCollection.findOne({ _id: result.insertedId });

    return mapStoreToPublicUser(found);
  }

  async findUserByEmail(email: string): Promise<Model.User.Store> {
    const userModel = await this.userCollection.findOne({ email });
    return userModel;
  }
}
