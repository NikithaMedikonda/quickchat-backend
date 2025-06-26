import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import { sequelizeInstance } from "../connection/dbconnection";
export class UserContacts extends Model<
  InferAttributes<UserContacts>,
  InferCreationAttributes<UserContacts>
> {
  declare id: CreationOptional<string>;
  declare ownerPhoneNumber: string;
  declare contactPhoneNumber: string;
  declare savedAs: string | null;
  declare updatedAt: Date;
}
UserContacts.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
      allowNull: false,
    },
    ownerPhoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "users",
        key: "phoneNumber",
      },
      field: "owner_phone_number",
    },
    contactPhoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "users",
        key: "phoneNumber",
      },
      field: "contact_phone_number",
    },
    savedAs: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: sequelizeInstance,
    tableName: "user_contacts",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["owner_phone_number", "contact_phone_number"],
      },
    ],
  }
);
