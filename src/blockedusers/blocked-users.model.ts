import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import { sequelizeInstance } from "../connection/dbconnection";
import { User } from "../user/user.model";

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
