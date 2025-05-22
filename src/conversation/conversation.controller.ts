import { Request, Response } from "express";
import { Op } from "sequelize";
import { Chat } from "../chat/chat.model";
import { findByPhoneNumber } from "../utils/findByPhoneNumber";
import { Conversation } from "./conversation.model";

export const deleteConversation = async (
  request: Request,
  response: Response
) => {
  try {
    const { senderPhoneNumber, receiverPhoneNumber, timestamp } = request.body;
    if (!senderPhoneNumber || !receiverPhoneNumber || !timestamp) {
      response
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
      response.status(204).end();
      return;
    }
    const [updatedCount] = await Conversation.update(
      { isDeleted: true, lastClearedAt: new Date(timestamp) },
      {
        where: {
          chatId: chat.id,
          userId: senderId,
        },
      }
    );
    response
      .status(200)
      .json({
        count: updatedCount,
        message: "Conversation deleted for the user.",
      });
    return;
  } catch (error) {
    response.status(500).json({ message: `${(error as Error).message}` });
  }
};
