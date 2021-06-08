import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserModel, UserDocument } from './user.schema';
import { Model } from 'mongoose';
import { CreateUserDto, User } from './types';
import { hashPassword } from '../common/password-utils';

@Injectable()
export class UserService {
  constructor(@InjectModel(UserModel.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<UserModel> {
    const passwordHash = await hashPassword(createUserDto.password);
    const { password, ...createArgs } = createUserDto;

    const created = new this.userModel({ ...createArgs, passwordHash });
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

  async findUserByEmail(email: string): Promise<User | undefined> {
    // return this.users.find(user => user.username === username);
    const user = await this.userModel.findOne({ email }).lean();
    return !user ? undefined : {
      id: user._id,
      username: user.username,
      email: user.email,
      passwordHash: user.passwordHash,
    };

    // return {
    //   id: 'todo',
    //   username: user.username,
    //   email: user.email,
    //   // id: user.id
    // }
  }
}
