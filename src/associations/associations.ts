import { BlockedUsers } from "../blockedusers/blocked-users.model";
import { Chat } from "../chat/chat.model";
import { Conversation } from "../conversation/conversation.model";
import { Message } from "../message/message.model";
import { User } from "../user/user.model";

export const syncAssociations = () => {
  User.hasMany(Chat, { as: "chatInitiated", foreignKey: "userAId" });
  User.hasMany(Chat, { as: "chatReceived", foreignKey: "userBId" });

  Chat.belongsTo(User, { as: "userA", foreignKey: "userAId" });
  Chat.belongsTo(User, { as: "userB", foreignKey: "userBId" });

  Chat.hasMany(Message, { foreignKey: "chatId" });
  Message.belongsTo(Chat, { foreignKey: "chatId" });

  User.hasMany(Message, { as: "messagesSent", foreignKey: "senderId" });
  User.hasMany(Message, { as: "messagesReceived", foreignKey: "receiverId" });
  Message.belongsTo(User, { as: "sender", foreignKey: "senderId" });
  Message.belongsTo(User, { as: "receiver", foreignKey: "receiverId" });
  
  User.hasMany(BlockedUsers, { as: "blockedUsers", foreignKey: "blocker" });
  User.hasMany(BlockedUsers, { as: "blockedBy", foreignKey: "blocked" });
  BlockedUsers.belongsTo(User, { as: "blocked_by", foreignKey: "blocker" });
  BlockedUsers.belongsTo(User, { as: "blocked_whom", foreignKey: "blocked" });

  User.belongsToMany(Chat, {
    through: Conversation,
    foreignKey: 'userId',
    otherKey: 'chatId',
  });
  
  Chat.belongsToMany(User, {
    through: Conversation,
    foreignKey: 'chatId',
    otherKey: 'userId',
  });
};
