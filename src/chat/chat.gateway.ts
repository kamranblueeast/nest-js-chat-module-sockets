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
import * as dotenv from 'dotenv';
dotenv.config();



@WebSocketGateway(+process.env.CHAT_GATEWAY_PORT)
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
