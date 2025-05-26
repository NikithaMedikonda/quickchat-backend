import { Request, Response } from "express";
import { Op } from "sequelize";
import { Chat } from "../chat/chat.model";
import { Conversation } from "../conversation/conversation.model";
import { Message, MessageStatus } from "../message/message.model";
import { ChatsOfUser } from "../types/chats";
import { User } from "../user/user.model";
import { findByPhoneNumber } from "../utils/findByPhoneNumber";

export const userChats = async (req: Request, res: Response) => {
  try {
    const { senderPhoneNumber, receiverPhoneNumber } = req.body;
    if (!senderPhoneNumber || !receiverPhoneNumber) {
      res
        .status(400)
        .json({ message: "Please provide all the necessary fields." });
      return;
    }
    const senderId = await findByPhoneNumber(senderPhoneNumber);
    const receiverId = await findByPhoneNumber(receiverPhoneNumber);
    const chat = await Chat.findOne({
      where: {
        [Op.or]: [
          { userAId: senderId, userBId: receiverId },
          { userAId: receiverId, userBId: senderId },
        ],
      },
    });

    if (!chat) {
      res.status(200).json({ chats: [] });
      return;
    }
    const conversation = await Conversation.findOne({
      where: {
        chatId: chat.id,
        userId: senderId,
      },
    });

    const lastClearedAt = conversation!.lastClearedAt ?? new Date(0);
    const messages = await Message.findAll({
      where: {
        chatId: chat.id,
        createdAt: {
          [Op.gt]: lastClearedAt,
        },
      },
      order: [["createdAt", "ASC"]],
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "phoneNumber"],
        },
        {
          model: User,
          as: "receiver",
          attributes: ["id", "phoneNumber"],
        },
      ],
    });
    res.status(200).json({
      chatId: chat.id,
      participants: [chat.userAId, chat.userBId],
      chats: messages,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" + error });
  }
};

export const getChatsOfUser = async (req: Request, res: Response) => {
  try {
    const userPhoneNumber = req.body.userPhoneNumber;
    if (!userPhoneNumber) {
      res.status(400).json({ message: "Please provide phone number." });
      return;
    }
    const userId = await findByPhoneNumber(userPhoneNumber);

    const chats = await Chat.findAll({
      where: {
        [Op.or]: [{ userAId: userId }, { userBId: userId }],
      },
      include: [
        {
          model: Message,
          limit: 1,
          order: [["createdAt", "DESC"]],
          required: true,
        },
        {
          model: User,
          as: "userA",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "profilePicture",
            "phoneNumber",
          ],
        },
        {
          model: User,
          as: "userB",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "profilePicture",
            "phoneNumber",
          ],
        },
      ],
    });

    const chatsOfUser = [];

    for (const chat of chats) {
      const chatData: ChatsOfUser = chat.toJSON();
      let contact;
      if (chat.userAId === chat.userBId) {
        contact = chatData.userA;
      } else {
        contact = chat.userAId === userId ? chatData.userB : chatData.userA;
      }

      const unreadCount = await Message.count({
        where: {
          chatId: chat.id,
          senderId: contact.id,
          receiverId: userId,
          status: { [Op.ne]: "read" as MessageStatus },
        },
      });

      const conversation = await Conversation.findOne({
        where: {
          userId: userId,
          chatId: chatData.id,
        },
      });

      let lastMessage;
      if (
        conversation &&
        conversation.isDeleted &&
        conversation.lastClearedAt
      ) {
        lastMessage =
          conversation.lastClearedAt < chatData.Messages[0].createdAt
            ? chatData.Messages[0]
            : null;
      } else {
        lastMessage = chatData.Messages[0];
      }

      if (!lastMessage) {
        continue;
      }

      chatsOfUser.push({
        chatId: chat.id,
        contactProfilePic: contact.profilePicture || null,
        contactName: `${contact.firstName} ${contact.lastName}`,
        phoneNumber: contact.phoneNumber,
        lastMessageText: lastMessage.content,
        lastMessageType:
          lastMessage.senderId === userId ? "sentMessage" : "receivedMessage",
        lastMessageStatus:
          lastMessage.senderId === userId ? lastMessage.status : null,
        lastMessageTimestamp: lastMessage.createdAt,
        unreadCount: unreadCount,
      });

      chatsOfUser.sort((chatA, chatB) => {
        const timeA = new Date(chatA.lastMessageTimestamp).getTime();
        const timeB = new Date(chatB.lastMessageTimestamp).getTime();
        return timeB - timeA; 
      });
    }

    res.status(200).json({ chats: chatsOfUser });
  } catch (error) {
    res.status(500).json({
      error: `Error getting chats of user ${(error as Error).message}`,
    });
  }
};