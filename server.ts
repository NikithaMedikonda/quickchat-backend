import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { sequelizeInstance } from "./src/connection/dbconnection";
import { syncAssociations } from "./src/associations/associations";

dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });
export const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors());

const startServer = async () => {
  try {
    if (!sequelizeInstance) {
      throw new Error("Sequelize instance not found. Please create!");
    }
    await sequelizeInstance.authenticate();
    console.log("Database connected successfully!");
    syncAssociations();
    console.log("Associations synced succesfully.")
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(
        `Error occurred during server startup:, ${error.message}`
      );
    } else {
      throw new Error(`An unknown error occurred.`);
    }
  }
};
startServer();
