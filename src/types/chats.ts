import { DbUser } from "./user";

export type ChatsOfUser = {
  id: string;
  userAId: string;
  userBId: string;
  createdAt: Date;
  updatedAt: Date;
  userA: Partial<DbUser>;
  userB: Partial<DbUser>;
  Messages: Array<{
    id: string;
    chatId: string;
    senderId: string;
    receiverId: string;
    content: string;
    status: string;
    isEncrypted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
};
