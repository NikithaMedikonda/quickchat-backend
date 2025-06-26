import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import { sequelizeInstance } from "../connection/dbconnection";

export class Otp extends Model<
  InferAttributes<Otp>,
  InferCreationAttributes<Otp>
> {
  declare id: CreationOptional<string>;
  declare email: string;
  declare otp: string;
  declare expiresAt: Date;
}

Otp.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique:true,
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiresAt:{
        type: DataTypes.DATE,
        allowNull:false
    }
  },
  {
    sequelize: sequelizeInstance,
    modelName: "Otp",
    tableName: "otp",
    timestamps: true,
    underscored: true,
  }
);
