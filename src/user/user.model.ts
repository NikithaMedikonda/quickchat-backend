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
  declare phoneNumber: string;
  declare firstName: string;
  declare lastName: string;
  declare profilePicture: string | null;
  declare email: string | null;
  declare password: string;
  declare isDeleted: boolean;
  declare publicKey: string;
  declare privateKey: string;
  declare socketId: string | null;
  declare isLogin : boolean;
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
    isLogin: {
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
