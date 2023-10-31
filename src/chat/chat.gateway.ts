// src/chat/chat.gateway.ts

import { WsExceptionFilter } from '@app/shared/filter';
import { Inject, UseFilters } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  DeleteMessageRequest,
  SendMessageRequest,
  UserConnectionRequest,
} from './dto';
import { validate } from 'class-validator';
import { ChatService } from './chat.service';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @Inject(ChatService)
  private readonly chatService: ChatService;

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // @UseGuards(JwtSocketAuthGuard)
  @UseFilters(new WsExceptionFilter())
  @SubscribeMessage('userConnected')
  async userConnected(
    @MessageBody() data: UserConnectionRequest,
    @ConnectedSocket() client: Socket,
  ) {
    const messageDto = new UserConnectionRequest();
    Object.assign(messageDto, data);
    const errors = await validate(messageDto);
    if (errors.length > 0) {
      throw new WsException(errors);
    }
    const { roomId } = data;
    client.join(roomId);
    this.server.in(roomId).emit('userJoinedRoom', roomId);
    console.log('User joined room');
  }

  // @UseGuards(JwtSocketAuthGuard)
  @UseFilters(new WsExceptionFilter())
  @SubscribeMessage('userDisconnected')
  async userDisconnected(
    @MessageBody() data: UserConnectionRequest,
    @ConnectedSocket() client: Socket,
  ) {
    const messageDto = new UserConnectionRequest();
    Object.assign(messageDto, data);
    const errors = await validate(messageDto);
    if (errors.length > 0) {
      throw new WsException(errors);
    }
    const { roomId } = data;

    client.leave(roomId);
    this.server.in(roomId).emit('userLeftRoom', roomId);
    console.log('User left room');
  }

  // @UseGuards(JwtSocketAuthGuard)
  @SubscribeMessage('sendMessage')
  @UseFilters(new WsExceptionFilter())
  async sendMessage(
    @MessageBody() data: SendMessageRequest,
    @ConnectedSocket() client: any,
  ) {
    const messageDto = new SendMessageRequest();
    Object.assign(messageDto, data);
    const errors = await validate(messageDto);
    if (errors.length > 0) {
      throw new WsException(errors);
    }
    const { receiverIds, roomId, senderId, content } = data;
    const messagePayload: any = {
      receiverIds,
      senderId,
      roomId: roomId,
      content,
    };

    const messages = await this.chatService.addMessage(messagePayload);
    // if (!client.user.userName) {
    //   const user = await this.userModel.findById({ _id: client.user.userId });
    //   if (user) {
    //     client.user.userName = user.userName;
    //   }
    // }
    if (messages) {
      //send message to receiver on specific room id
      const messageEmit: any = {
        messageId: messages._id,
        content: content,
        senderId,
        roomId,
        createdAt: messages.createdAt,
      };
      this.server
        .to(roomId)
        .emit('messageReceived', JSON.stringify(messageEmit));

      // if (notificationSetting?.message && !sendNotification) {
      //   const messageBy = await this.userModel
      //     .findOne({ _id: client.user.userId })
      //     .select('fullName profileURL gender thumbnailURL userName');
      //   await this.notificationService.sendDataNotification(
      //     notificationSetting.userId.deviceToken,
      //     {
      //       data: JSON.stringify({
      //         message: 'Sent you a Message',
      //         type: 'Message',
      //         sender: messageBy,
      //         roomId: roomId,
      //       }),
      //     },
      //     'high',
      //   );
      // }
      console.log('message sent');
    }
  }

  @UseFilters(new WsExceptionFilter())
  @SubscribeMessage('deleteMessage')
  async deleteMessage(@MessageBody() data: DeleteMessageRequest) {
    const messageDto = new DeleteMessageRequest();
    Object.assign(messageDto, data);
    const errors = await validate(messageDto);
    if (errors.length > 0) {
      throw new WsException(errors);
    }
    const { messageId, roomId } = data;
    const response = await this.chatService.deleteMessage(messageId);
    console.log('Message deleted successfully');
    this.server.to(roomId).emit('messageDeleted', { messageId, roomId });
  }
}
