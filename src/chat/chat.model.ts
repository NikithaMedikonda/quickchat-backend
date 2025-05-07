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
      type: DataTypes.STRING,

      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      field: "user1_id",
    },
    userBId: {
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
