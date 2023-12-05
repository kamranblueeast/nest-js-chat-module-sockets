import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import {
  AddMemberRoomRequest,
  CreateRoomRequest,
  RoomChatListRequest,
  RoomListRequest,
  UpdateRoomRequest,
  UserConnectionRequest,
} from './dto';
import { query } from 'express';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('room')
  private async createRoom(@Body() body: CreateRoomRequest) {
    const response = await this.chatService.createUserRoom(body);
    return response;
  }

  @Put('room')
  private async updateRoom(@Body() body: UpdateRoomRequest) {
    const response = await this.chatService.updateUserRoom(body);
    return response;
  }

  @Get('rooms')
  private async roomList(@Query() query: RoomListRequest) {
    const response = await this.chatService.roomList(query);
    return response;
  }
  @Get('room')
  private async roomDetail(@Query() query: UserConnectionRequest) {
    const response = await this.chatService.room(query);
    return response;
  }
  @Put('room/add-user')
  private async addUserInRoom(@Body() body: AddMemberRoomRequest) {
    const response = await this.chatService.addUserRoom(body);
    return response;
  }
  @Put('room/remove-user')
  private async removeUserInRoom(@Body() body: AddMemberRoomRequest) {
    const response = await this.chatService.removeUserRoom(body);
    return response;
  }

  @Get('users-list')
  private async usersList(@Query() query: RoomListRequest) {
    const response = await this.chatService.usersList(query);
    return response;
  }

  @Get('room-chat')
  private async roomChatList(@Query() query: RoomChatListRequest) {
    const response = await this.chatService.roomChatList(query);
    return response;
  }
}
