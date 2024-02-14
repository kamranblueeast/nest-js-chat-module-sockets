import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseModel } from '@app/shared/base-model';

export type UserMessageCountDocument = HydratedDocument<UserMessageCount>;

@Schema()
export class UserMessageCount extends BaseModel {
  @Prop({ type: String })
  userId: string;

  @Prop()
  count: number;

  @Prop({ default: Date.now })
  startDate: Date;

}

const UserMessageCountSchema = SchemaFactory.createForClass(UserMessageCount);
UserMessageCountSchema.index({ userId: 1 }, { unique: true });
export { UserMessageCountSchema };
