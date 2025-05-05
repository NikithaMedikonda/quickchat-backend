import { Dialect, Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

export const SequelizeConnection = () => {
  let sequelize;
  if (
    !process.env.DB_DIALECT ||
    !process.env.DATABASE_URL ||
    !process.env.DB_HOST 
  ) {
    console.error("Environment Variables missing!");
    return;
  } else {
    sequelize = new Sequelize(process.env.DATABASE_URL as string, {
      host: process.env.DB_HOST,
      dialect: process.env.DB_DIALECT as Dialect,
      logging: false,
    });
  }
  return sequelize;
};

export const sequelizeInstance = SequelizeConnection();
