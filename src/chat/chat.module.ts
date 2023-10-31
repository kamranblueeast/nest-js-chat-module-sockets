import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatSchema, RoomSchema } from './model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Room', schema: RoomSchema },
      { name: 'Chat', schema: ChatSchema },
    ]),
  ],
  providers: [ChatGateway, ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
