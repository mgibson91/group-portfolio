import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuid } from 'uuid';

export type PortfolioDocument = PortfolioModel & Document;

@Schema()
export class PortfolioModel {
  @Prop({ required: true, default: () => uuid() })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  createdBy: string; // User ID

  @Prop(raw({
    userId: { type: String },
    percentage: { type: Number },
  }))
  breakdown: Record<string, number>;
}

export const PortfolioSchema = SchemaFactory.createForClass(PortfolioModel);
