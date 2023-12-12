import { RoomTypeEnum, UpdateRoomTypeEnum } from '@app/shared/enum/chat.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import {
  IsArray,
  IsBoolean,
  IsDate,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Validate,
  ValidateNested,
} from 'class-validator';
import { Socket } from 'socket.io';

export class PaginationListRequest {
  @ApiProperty({
    type: Number,
  })
  @IsNotEmpty()
  page: number;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  pageSize: number;
}

export class UserConnectionRequest {
  @IsString()
  @IsNotEmpty()
  roomId: string;
}

export class UserRoomRequest extends UserConnectionRequest {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class CreateRoomRequest {
  @IsString()
  createdBy: string;

  @IsString()
  @IsNotEmpty()
  roomTitle: string;

  @IsString()
  @IsNotEmpty()
  roomDescription: string;

  @IsEnum(RoomTypeEnum)
  roomType: RoomTypeEnum;

  @IsArray()
  @Type(() => String)
  members: string[];
}

export class UpdateRoomRequest {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsOptional()
  roomTitle: string;

  @IsString()
  @IsOptional()
  roomDescription: string;

  @IsEnum(UpdateRoomTypeEnum)
  roomType: UpdateRoomTypeEnum;

  @IsArray()
  @Type(() => String)
  @IsOptional()
  members: string[];
}
export class AddMemberRoomRequest {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsArray()
  @Type(() => String)
  @IsOptional()
  members: string[];
}
export class SendMessageRequest {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  senderId: string;

  @IsArray()
  @IsNotEmpty()
  receiverIds: string[];

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class RoomChatListRequest extends PaginationListRequest {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class RoomListRequest extends PaginationListRequest {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class DeleteMessageRequest {
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsString()
  @IsNotEmpty()
  roomId: string;
}
