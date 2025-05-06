import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import { sequelizeInstance } from "../connection/dbconnection";
import { User } from "../user/user.model";
import { Chat } from "../chat/chat.model";

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
