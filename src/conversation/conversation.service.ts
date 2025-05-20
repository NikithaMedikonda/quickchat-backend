import { Conversation } from "./conversation.model";

export const createConversation = async (
  chatId: string,
  userId: string
): Promise<Conversation> => {
  try {
    let conversation = await Conversation.findOne({
      where: { chatId: chatId, userId: userId },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        chatId: chatId,
        userId: userId,
        isDeleted: false,
      });
    }
    return conversation;
  } catch (error) {
    throw new Error(`${error}`);
  }
};
