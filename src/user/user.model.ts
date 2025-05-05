import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import { sequelizeInstance } from "../connection/dbconnection";

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<string>;
  declare phoneNumber: number;
  declare firstName: string;
  declare lastName: string;
  declare profilePicture: string;
  declare email: string;
  declare password: string;
  declare isDeleted: boolean;
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
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    profilePicture: {
      type: DataTypes.STRING,
      unique: true,
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
  },
  {
    sequelize: sequelizeInstance!,
    modelName: "User",
    tableName: "users",
    timestamps: true,
  }
);

