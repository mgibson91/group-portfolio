import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { hashPassword } from '@common/password-utils';
import { Model } from '../../index';
import { CustomProviders } from '@common/nest-common';
import { Collection, MongoClient } from 'mongodb';
import { Collections } from '@common/collections';
import { v4 as uuid } from "uuid";
import { InputRegister } from './user.resolver';

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

  async create(createUserDto: InputRegister): Promise<Model.User.Public> {
    const passwordHash = await hashPassword(createUserDto.password);
    const { password, ...createArgs } = createUserDto;

    const result = await this.userCollection.insertOne({ ...createArgs, _id: uuid(), passwordHash });
    const found = await this.userCollection.findOne({ _id: result.insertedId });
    if (!found) {
      console.error('Unable to create user')
      throw new InternalServerErrorException('User not created');
    }

    return mapStoreToPublicUser(found);
  }

  async findExistingUserByEmail(email: string): Promise<Model.User.Store> {
    const userModel = await this.userCollection.findOne({ email });
    if (!userModel) {
      console.error('User does not exist')
      throw new NotFoundException('User does not exist');
    }

    return userModel;
  }
}
