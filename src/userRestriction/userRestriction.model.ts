import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import { sequelizeInstance } from "../connection/dbconnection";
import { User } from "../user/user.model";

export class UserRestriction extends Model<
  InferAttributes<UserRestriction>,
  InferCreationAttributes<UserRestriction>
> {
  declare id: CreationOptional<string>;
  declare blocker: string;
  declare blocked: string;
}

UserRestriction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
      allowNull: false,
    },
    blocker: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      field: "blocker_id",
    },
    blocked: {
      type: DataTypes.UUID,
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
    modelName: "UserRestriction",
    tableName: "userRestrictions",
    timestamps: true,
  }
);
