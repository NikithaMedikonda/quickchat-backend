import { Op } from "sequelize";
import { createConversation } from "../conversation/conversation.service";
import { Chat } from "./chat.model";

export const findOrCreateChat = async (
  senderId: string,
  receiverId: string
): Promise<Chat> => {
  try {
    let chat = await Chat.findOne({
      attributes: ["id"],
      where: {
        [Op.or]: [
          { userAId: receiverId, userBId: senderId },
          { userAId: senderId, userBId: receiverId },
        ],
      },
    });
    if (!chat) {
      chat = await Chat.create({
        userAId: senderId,
        userBId: receiverId,
      });
      await createConversation(chat.id, senderId);
      await createConversation(chat.id, receiverId);
    }
    return chat;
  } catch (error) {
    throw new Error(`${error}`);
  }
};
