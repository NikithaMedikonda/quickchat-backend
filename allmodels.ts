import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelizeInstance } from "./src/connection/dbconnection";

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<string>;
  declare phoneNumber: string;
  declare firstName: string;
  declare lastName: string;
  declare profilePicture: string | null;
  declare email: string | null;
  declare password: string;
  declare isDeleted: boolean;
  declare publicKey: string;
  declare privateKey: string;
  declare socketId: string;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      unique: false,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      unique: false,
      allowNull: false,
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    publicKey: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    privateKey: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    socketId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize: sequelizeInstance!,
    modelName: "User",
    tableName: "users",
    timestamps: true,
  }
);

export class Chat extends Model<
  InferAttributes<Chat>,
  InferCreationAttributes<Chat>
> {
  declare id: CreationOptional<string>;
  declare userAId: string;
  declare userBId: string;
}

Chat.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
      allowNull: false,
    },
    userAId: {
      type: DataTypes.UUID,

      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      field: "user1_id",
    },
    userBId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      field: "user2_id",
    },
  },
  {
    sequelize: sequelizeInstance!,
    modelName: "Chat",
    tableName: "chats",
    timestamps: true,
  }
);


export class BlockedUsers extends Model<
  InferAttributes<BlockedUsers>,
  InferCreationAttributes<BlockedUsers>
> {
  declare id: CreationOptional<string>;
  declare blocker: string;
  declare blocked: string;
}

BlockedUsers.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
      allowNull: false,
    },
    blocker: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      field: "blocker_id",
    },
    blocked: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      field: "blocked_id",
    },
  },
  {
    sequelize: sequelizeInstance!,
    modelName: "Block",
    tableName: "blocks",
    timestamps: true,
  }
);



export class Conversation extends Model<
  InferAttributes<Conversation>,
  InferCreationAttributes<Conversation>
> {
  declare id: CreationOptional<string>;
  declare chatId: string;
  declare userId: string;
  declare isDeleted: boolean;
  declare lastClearedAt: Date | null;
}

Conversation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    chatId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Chat,
        key: "id",
      },
      field: "chat_id",
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User, 
        key: "id",
      },
      field: "user_id",
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_deleted",
    },
    lastClearedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_cleared_at",
      defaultValue:null
    },
  },
  {
    sequelize: sequelizeInstance,
    modelName: "Conversation",
    tableName: "conversations",
    timestamps: true,
    underscored: true,
  }
);


export enum MessageStatus {
  Sent = "sent",
  Delivered = "delivered",
  Read = "read",
}

export class Message extends Model<
  InferAttributes<Message>,
  InferCreationAttributes<Message>
> {
  declare id: CreationOptional<string>;
  declare chatId: string;
  declare senderId: string;
  declare receiverId: string;
  declare content: string;
  declare status: MessageStatus;
  declare isEncrypted: boolean;
  declare createdAt: Date;
}

Message.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    chatId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Chat,
        key: "id",
      },
      field: "chat_id",
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      field: "sender_id",
    },
    receiverId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      field: "receiver_id",
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(MessageStatus)),
      defaultValue: MessageStatus.Sent,
    },
    isEncrypted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_encrypted",
    },
    createdAt: DataTypes.DATE,
  },
  {
    sequelize: sequelizeInstance,
    modelName: "Message",
    tableName: "messages",
    timestamps: true,
    underscored: true,
  }
);


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
