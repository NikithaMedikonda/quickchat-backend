import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import { Chat } from "../chat/chat.model";
import { sequelizeInstance } from "../connection/dbconnection";
import { User } from "../user/user.model";

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
