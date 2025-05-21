import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { syncAssociations } from "./src/associations/associations";
import { chatRouter } from "./src/chat/chat.router";
import { sequelizeInstance } from "./src/connection/dbconnection";
import { messageRouter } from "./src/message/message.router";
import { userRouter } from "./src/user/user.route";

dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });
export const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors());
app.use(chatRouter);
app.use(userRouter);
app.use(messageRouter);

const startServer = async () => {
  try {
    if (!sequelizeInstance) {
      throw new Error("Sequelize instance not found. Please create!");
    }
    await sequelizeInstance.authenticate();
    syncAssociations();
    await sequelizeInstance.sync({ alter: true });
    if (process.env.NODE_ENV !== "test") {
      app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
      });
    }
  } catch (error) {
    `Error occurred during server startup:, ${error}`;
  }
};
startServer();
