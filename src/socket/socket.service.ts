import { Chat } from "../chat/chat.model";
import { findOrCreateChat } from "../chat/chat.service";
import { Message, MessageStatus } from "../message/message.model";
import { createMessage } from "../message/message.service";
import { DeliveredMessageDetails, PrivateMessage } from "../types/message";
import { User } from "../user/user.model";
import { UserRestriction } from "../userRestriction/userRestriction.model";
import { findByPhoneNumber } from "../utils/findByPhoneNumber";

export const updateUserSocketId = async (
  phoneNumber: string,
  socketId: string | null
) => {
  const existingUser = await User.findOne({
    where: { phoneNumber: phoneNumber },
  });
  if (!existingUser) {
    return { message: "Invalid phone number" };
  }
  await User.update(
    {
      socketId: socketId,
    },
    { where: { phoneNumber: existingUser.phoneNumber } }
  );
  return existingUser;
};

export const findUserSocketId = async (recipientPhoneNumber: string) => {
  const existingUser = await User.findOne({
    where: { phoneNumber: recipientPhoneNumber },
  });
  if (!existingUser) {
    return null;
  }
  return existingUser.socketId;
};

export const storeMessage = async ({
  recipientPhoneNumber,
  senderPhoneNumber,
  message,
  status,
  timestamp,
}: PrivateMessage) => {
  const senderId = await findByPhoneNumber(senderPhoneNumber);
  const recipientId = await findByPhoneNumber(recipientPhoneNumber);
  const chat: Chat = await findOrCreateChat(senderId, recipientId);
  const newMessage: Message = await createMessage(
    senderId,
    recipientId,
    chat.id,
    message,
    status,
    timestamp
  );
  return newMessage;
};

export const disconnectUser = async (socketId: string) => {
  const existingUser: User | null = await User.findOne({
    where: { socketId: socketId },
  });
  if (!existingUser) {
    return { message: "No user exist with this socket id" };
  }
  await User.update(
    {
      socketId: null,
    },
    { where: { phoneNumber: existingUser.phoneNumber } }
  );
  return existingUser;
};
export const changeStatusToDelivered = async (phoneNumber: string) => {
  const recipientId = await findByPhoneNumber(phoneNumber);
  const status = "delivered";
  const updatingMessages = await Message.findAll({
    where: {
      status: "sent",
      receiverId: recipientId,
    },
  });

  const messageMap: Record<string, string[]> = {};

  updatingMessages.forEach((msg) => {
    if (!messageMap[msg.senderId]) {
      messageMap[msg.senderId] = [];
    }
    messageMap[msg.senderId].push(msg.content);
  });
  await Message.update(
    { status: status as MessageStatus },
    {
      where: {
        receiverId: recipientId,
        status: "sent",
      },
    }
  );
  const finalMessages: DeliveredMessageDetails[] = Object.entries(
    messageMap
  ).map(([senderId, message]) => ({
    senderId,
    message,
  }));

  return finalMessages;
};
export async function getBlockedSocketIds(userPhoneNumber: string) {
  const userId = await findByPhoneNumber(userPhoneNumber);
  const blocked = await UserRestriction.findAll({ where: { blocker: userId } });
  const blockedIds = blocked.map((blockedUser) => blockedUser.blocked);
  const socketIds: string[] = [];
  for (const user of blockedIds) {
    const socketId = await User.findOne({ where: { id: user } });
    if (socketId && socketId.socketId !== null) {
      socketIds.push(socketId.socketId);
    }
  }
  return socketIds;
}
