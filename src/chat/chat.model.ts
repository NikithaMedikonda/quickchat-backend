import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import { sequelizeInstance } from "../connection/dbconnection";
import { User } from "../user/user.model";

export class Chat extends Model<
  InferAttributes<Chat>,
  InferCreationAttributes<Chat>
> {
  declare id: CreationOptional<string>;
  declare user1Id: string;
  declare user2Id: string;
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
    user1Id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      field: "user1_id",
    },
    user2Id: {
      type: DataTypes.STRING,
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
