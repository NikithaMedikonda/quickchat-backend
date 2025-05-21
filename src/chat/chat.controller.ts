import { Request, Response } from "express";
import { Op } from "sequelize";
import { Chat } from "../chat/chat.model";
import { Conversation } from "../conversation/conversation.model";
import { Message } from "../message/message.model";
import { User } from "../user/user.model";
import { findByPhoneNumber } from "../utils/findByPhoneNumber";

export const userChats = async (req: Request, res: Response) => {
  const { senderPhoneNumber, receiverPhoneNumber } = req.body;
  if (!senderPhoneNumber || !receiverPhoneNumber) {
    res
      .status(400)
      .json({ message: "Please provide all the necessary fields." });
    return;
  }

  const senderId = await findByPhoneNumber(senderPhoneNumber);
  const receiverId = await findByPhoneNumber(receiverPhoneNumber);

  try {
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

    const lastClearedAt = conversation?.lastClearedAt ?? new Date(0);
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
    res.json({
      chatId: chat.id,
      participants: [chat.userAId, chat.userBId],
      chats: messages,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" + error });
  }
};
