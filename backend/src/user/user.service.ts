import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserModel, UserDocument } from 'src/schemas/user';
import { Model } from 'mongoose';
import { CreateUserDto, User } from './types';

// // This should be a real class/interface representing a user entity
// export type User = any;

@Injectable()
export class UserService {
  constructor(@InjectModel(UserModel.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<UserModel> {
    const created = new this.userModel(createUserDto);
    return created.save();
  }

  // private readonly users = [
  //   {
  //     userId: 1,
  //     username: 'john',
  //     password: 'changeme',
  //   },
  //   {
  //     userId: 2,
  //     username: 'maria',
  //     password: 'guess',
  //   },
  // ];

  async findOne(username: string): Promise<User | undefined> {
    // return this.users.find(user => user.username === username);
    const user = await this.userModel.findOne({ username });
    if (!user) {
      return;
    }

    return {
      id: 'todo',
      username: user.username,
      email: user.email,
      // id: user.id
    }
  }
}
