import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = UserModel & Document;

@Schema()
export class UserModel {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  passwordHash: string;
}

export const UserSchema = SchemaFactory.createForClass(UserModel);
