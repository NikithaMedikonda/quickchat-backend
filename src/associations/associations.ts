import { BlockedUsers } from "../blockedusers/blocked-users.model";
import { Chat } from "../chat/chat.model";
import { Conversation } from "../conversation/conversation.model";
import { Message } from "../message/message.model";
import { User } from "../user/user.model";

export const syncAssociations = () => {
  User.hasMany(Chat, { as: "chatInitiated", foreignKey: "chatId" });
  User.hasMany(Chat, { as: "chatReceived", foreignKey: "chatId" });

  Chat.belongsTo(User, { as: "user1", foreignKey: "user1Id" });
  Chat.belongsTo(User, { as: "user2", foreignKey: "user2Id" });

  Chat.hasMany(Message, { foreignKey: "chatId" });
  Message.belongsTo(Chat, { foreignKey: "chatId" });

  User.hasMany(Message, { as: "MessagesSent", foreignKey: "senderId" });
  User.hasMany(Message, { as: "MessagesReceived", foreignKey: "receiverId" });
  Message.belongsTo(User, { as: "sender", foreignKey: "senderId" });
  Message.belongsTo(User, { as: "receiver", foreignKey: "receiverId" });

  User.hasMany(Conversation, { foreignKey: "userId" });
  Conversation.belongsTo(User, { foreignKey: "userId" });

  User.hasMany(BlockedUsers, { as: "BlockedUsers", foreignKey: "blocker" });
  User.hasMany(BlockedUsers, { as: "BlockedBy", foreignKey: "blocked" });
  BlockedUsers.belongsTo(User, { as: "blocked_by", foreignKey: "blocker" });
  BlockedUsers.belongsTo(User, { as: "blocked_whom", foreignKey: "blocked" });
};
