import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserModel } from '../user/user.schema';

export type PortfolioDocument = PortfolioModel & Document;

@Schema()
export class PortfolioModel {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  subscribedUsers: UserModel;
}

export const PortfolioSchema = SchemaFactory.createForClass(PortfolioModel);
