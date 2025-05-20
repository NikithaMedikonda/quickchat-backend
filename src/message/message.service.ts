import { Message, MessageStatus } from "./message.model";

export const createMessage = async (
  senderId: string,
  receiverId: string,
  chatId: string,
  content: string,
  timestamp: string
): Promise<Message> => {
  try {
    const message = await Message.create({
      chatId: chatId,
      senderId: senderId,
      receiverId: receiverId,
      content: content,
      status: MessageStatus.Sent,
      isEncrypted: true,
      createdAt: new Date(timestamp),
    });
    return message;
  } catch (error) {
    throw new Error(`${error}`);
  }
};
