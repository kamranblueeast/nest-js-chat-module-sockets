import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class BaseModel {
  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop()
  deletedAt: Date;
}
