import * as mongoose from 'mongoose';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseModel } from '@app/shared/base-model';

export type RoomDocument = HydratedDocument<Room>;


@Schema()
export class Room extends BaseModel {
  @Prop()
  createdBy: string;

  @Prop()
  roomTitle: string;

  @Prop()
  roomType: string;

  @Prop()
  roomDescription: string;

  @Prop({ type: JSON })
  metadata: object;

  @Prop({ type: [{ type: String }] })
  members: string[];
}

export const RoomSchema = SchemaFactory.createForClass(Room);
