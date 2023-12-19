import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { ChatDocument } from './model/chat.model';
import { RoomDocument } from './model/room.model';
import {
  AddMemberRoomRequest,
  CreateRoomRequest,
  PaginationListRequest,
  RoomChatListRequest,
  RoomListRequest,
  UpdateRoomRequest,
  UserConnectionRequest,
  UserRoomRequest,
} from './dto';
import { RoomTypeEnum } from '@app/shared/enum/chat.enum';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel('Chat') private readonly chatModel: Model<ChatDocument>,
    @InjectModel('Room') private readonly roomModel: Model<RoomDocument>,
  ) {}

  async createUserRoom(data: CreateRoomRequest) {
    if (data.roomType === RoomTypeEnum.OneToOne) {
      if (data.members.length > 1) {
        throw new BadRequestException(
          'For one to one you cannot pass more than one member',
        );
      }
      const isExist = await this.roomModel.findOne({
        $or: [
          {
            members: data.createdBy,
            createdBy: data.members[0],
          },
          {
            createdBy: data.createdBy,
            members: data.members[0],
          },
        ],
      });
      if (isExist) {
        throw new ConflictException(
          'You have already created room for this user!',
        );
      }
      const newRoom = await this.roomModel.create(data);
      return { data: newRoom, status: HttpStatus.OK, success: true };
    } else if (data.roomType === RoomTypeEnum.Group) {
      const groupRoom = await this.roomModel.create(data);
      return { data: groupRoom, status: HttpStatus.OK, success: true };
    }
  }
  async updateUserRoom(data: UpdateRoomRequest) {
    const room = await this.roomModel.findOne({ _id: data.roomId });
    if (!room) {
      throw new NotFoundException('Room not found!');
    }
    const response = await this.roomModel.findOneAndUpdate(
      {
        _id: data.roomId,
        roomType: RoomTypeEnum.Group,
      },
      { ...data },
      { new: true },
    );
    if (!response) {
      throw new BadRequestException('Room not updated!');
    }
    return { message: 'Room Updated Successfully!', data: response };
  }

  async addUserRoom(data: AddMemberRoomRequest) {
    const room = await this.roomModel.findOne({ _id: data.roomId });
    if (!room) {
      throw new NotFoundException('Room not found!');
    }
    const response = await this.roomModel.findOneAndUpdate(
      {
        _id: data.roomId,
        roomType: RoomTypeEnum.Group,
        members: { $nin: data.members },
      },
      { $push: { members: { $each: data.members } } },
      { new: true },
    );
    if (!response) {
      throw new BadRequestException('Member is Already exits!');
    }

    return { message: 'Member add in the room  Successfully!', data: response };
  }

  async removeUserRoom(data: AddMemberRoomRequest) {
    const room = await this.roomModel.findOne({ _id: data.roomId });
    if (!room) {
      throw new NotFoundException('Room not found!');
    }
    const response = await this.roomModel.findOneAndUpdate(
      {
        _id: data.roomId,
        roomType: RoomTypeEnum.Group,
      },
      { $pullAll: { members: data.members } },
      { new: true },
    );
    if (!response) {
      throw new BadRequestException('Member not exits!');
    }
    return {
      message: 'Member removed from the room  Successfully!',
      data: response,
    };
  }

  async roomList(data: RoomListRequest) {
    const skip = (Number(data.page) - 1) * Number(data.pageSize);

    let totalCount = await this.roomModel.countDocuments({
      $or: [
        { createdBy: data.userId },
        {
          members: { $in: data.userId },
        },
      ],
    });

    const response = await this.roomModel
      .find({
        $or: [
          { createdBy: data.userId },
          {
            members: { $in: data.userId },
          },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(+data.pageSize);

    totalCount = totalCount || 0;

    const totalPages = Math.ceil(+totalCount / +data.pageSize);

    const paginatedData = {
      totalCount,
      totalPages,
      currentPage: +data.page,
      roomUsers: response,
    };

    return {
      statusCode: HttpStatus.OK,
      data: paginatedData,
      success: true,
    };
  }
  async room(data: UserConnectionRequest) {
    const response = await this.roomModel.findOne({ _id: data.roomId });

    return {
      statusCode: HttpStatus.OK,
      data: response,
      success: true,
    };
  }

  async addMessage(data) {
    const response = await this.chatModel.create(data);
    return response;
  }

  async findAndUpdate(criteria, data) {
    const messages = await this.chatModel.findOneAndUpdate(criteria, data, {
      new: true,
    });
    return messages;
  }

  async deleteMessage(messageId) {
    const messages = await this.chatModel.findByIdAndDelete(messageId);
    return messages;
  }

  async updateMessage(messageId, message) {
    const messages = await this.chatModel.findByIdAndUpdate(
      { _id: messageId },
      { message, isEdited: true },
      { new: true },
    );
    return messages;
  }

  async usersList(data: RoomListRequest) {
    const skip = (Number(data.page) - 1) * Number(data.pageSize);

    let totalCount = await this.chatModel.aggregate([
      // match messages where the userId exists as either the senderId or receiverId
      {
        $match: {
          deletedBy: {
            $not: { $in: [data.userId] },
          },
          $or: [
            { senderId: data.userId },
            {
              receiverIds: { $in: [data.userId] },
            },
          ],
        },
      },

      // sort by _id and timestamp in descending order
      { $sort: { createdAt: -1 } },
      // group by roomId and find the first document for each group
      {
        $group: {
          _id: '$roomId',
          latestMessage: { $first: '$$ROOT' },
        },
      },
      { $count: 'totalCount' },
    ]);

    const response = await this.chatModel.aggregate([
      // match messages where the userId exists as either the senderId or receiverId
      {
        $match: {
          deletedBy: {
            $not: { $in: [data.userId] },
          },
          $or: [
            { senderId: data.userId },
            {
              receiverIds: { $in: [data.userId] },
            },
          ],
        },
      },
      {
        $sort: {
          _id: -1,
          createdAt: -1,
        },
      },
      // group by roomId and find the first document for each group
      {
        $group: {
          _id: '$roomId',
          latestMessage: { $first: '$$ROOT' },
        },
      },
      {
        $lookup: {
          from: 'rooms',
          localField: 'latestMessage.roomId',
          foreignField: '_id',
          as: 'room',
        },
      },
      {
        $sort: {
          'latestMessage.createdAt': -1,
          'latestMessage._id': -1,
        },
      },
      // project only the fields we need
      {
        $project: {
          _id: '$latestMessage._id',
          createdAt: '$latestMessage.createdAt',
          roomId: '$latestMessage.roomId',
          sender: 1,
          receiver: 1,
          message: '$latestMessage.message',
          messageType: '$latestMessage.messageType',
          room: { $arrayElemAt: ['$room', 0] },
        },
      },
      { $skip: +skip },

      // limit the number of documents returned based on the given limit
      { $limit: +data.pageSize },
    ]);

    totalCount = totalCount[0]?.totalCount || 0;

    const totalPages = Math.ceil(+totalCount / +data.pageSize);

    const paginatedData = {
      totalCount,
      totalPages,
      currentPage: +data.page,
      friendList: response,
    };
    return {
      statusCode: HttpStatus.OK,
      data: paginatedData,
      error: [],
      success: true,
    };
  }

  async roomChatList(data: RoomChatListRequest) {
    const skip = (Number(data.page) - 1) * Number(data.pageSize);

    let totalCount = await this.chatModel.countDocuments({
      roomId: data.roomId,
      $or: [
        {
          receiverIds: { $in: [data.userId] },
        },
        {
          senderId: data.userId,
        },
      ],
      deletedBy: { $not: { $in: [data.userId] } },
    });

    const response = await this.chatModel
      .find({
        roomId: data.roomId,
        $or: [
          {
            receiverIds: { $in: [data.userId] },
          },
          {
            senderId: data.userId,
          },
        ],
        deletedBy: { $not: { $in: [data.userId] } },
      })
      .sort({ createdAt: -1 })
      .skip(+skip)
      .limit(+data.pageSize);

    totalCount = totalCount ? totalCount : 0;
    const totalPages = Math.ceil(+totalCount / +data.pageSize);

    const paginatedData = {
      totalCount,
      totalPages,
      currentPage: +data.page,
      chatList: response,
    };
    return {
      statusCode: HttpStatus.OK,
      data: paginatedData,
      error: [],
      success: true,
    };
  }

  async deleteRoomChat(data: UserRoomRequest) {
    const roomChat = await this.chatModel.updateMany(
      { roomId: data.roomId },
      { $addToSet: { deletedBy: data.userId } },
    );

    return {
      statusCode: HttpStatus.OK,
      data: JSON.stringify(''),
      error: [],
      success: true,
    };
  }

  async deleteRoom(data: UserConnectionRequest) {
    await this.chatModel.deleteMany({ roomId: data.roomId });
    const roomChat = await this.roomModel.deleteOne({ _id: data.roomId });

    return {
      statusCode: HttpStatus.OK,
      data: { message: 'Room deleted successfully!' },
      error: [],
      success: true,
    };
  }
}
