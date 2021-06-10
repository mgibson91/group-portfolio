import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserModel } from '../user/user.schema';
import { v4 as uuid } from 'uuid';

export type PortfolioSubscribersDocument = PortfolioSubscribersModel & Document;

@Schema()
export class PortfolioSubscribersModel {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  portfolioId: string;
}

export const PortfolioSubscribersSchema = SchemaFactory.createForClass(PortfolioSubscribersModel);
