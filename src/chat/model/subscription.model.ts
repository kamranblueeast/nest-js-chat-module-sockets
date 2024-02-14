import * as mongoose from 'mongoose';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseModel } from '@app/shared/base-model';
import { SubscriptionTypeEnum } from '@app/shared/enum/chat.enum';

export type SubscriptionDocument = mongoose.HydratedDocument<Subscription>;

@Schema()
export class Subscription extends BaseModel {
  @Prop()
  userId: string;

  @Prop({ type: String, enum: SubscriptionTypeEnum })
  subscriptionType: SubscriptionTypeEnum;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop()
  status: string;

  @Prop({ type: JSON })
  paymentInfo: JSON;
}

const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
SubscriptionSchema.index({ userId: 1 }, { unique: true });
export { SubscriptionSchema };
