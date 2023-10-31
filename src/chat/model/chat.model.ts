import * as mongoose from 'mongoose';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseModel } from '@app/shared/base-model';
import { Room, UserType } from './room.model';

export type ChatDocument = HydratedDocument<Chat>;

@Schema()
export class Chat extends BaseModel {
  @Prop({ type: String })
  senderId: UserType;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Room' })
  roomId: Room;

  @Prop([{ type: String }])
  receiverIds: string[];

  @Prop()
  content: string;

  @Prop({ type: Boolean, default: false })
  isEdited: boolean;

  @Prop([{ type: String }])
  deletedBy: string[];

  @Prop({ type: JSON })
  metadata: object;
}

const ChatSchema = SchemaFactory.createForClass(Chat);
ChatSchema.index({ roomId: 1 });
export { ChatSchema };
