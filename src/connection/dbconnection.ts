import { Dialect, Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

export const SequelizeConnection = () => {
  let sequelize;
  try {
    if (
      !process.env.DB_DIALECT ||
      !process.env.DATABASE_URL ||
      !process.env.DB_HOST
    ) {
      throw new Error("Environment Variables are missing!");
    } else {
      sequelize = new Sequelize(process.env.DATABASE_URL as string, {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT as Dialect,
        logging: false,
      });
    }
    return sequelize;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const sequelizeInstance = SequelizeConnection();
