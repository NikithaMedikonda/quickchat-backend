import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { syncAssociations } from "./src/associations/associations";
import { chatRouter } from "./src/chat/chat.router";
import { sequelizeInstance } from "./src/connection/dbconnection";
import { userConversationRouter } from "./src/conversation/conversation.route";
import { messageRouter } from "./src/message/message.router";
import { setupSocket } from "./src/socket/socket";
import { userRouter } from "./src/user/user.route";
import { userRestrictionRouter } from "./src/userRestriction/userRestriction.router";

dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

export const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors());
app.use(chatRouter);
app.use(userRouter);
app.use(messageRouter);
app.use(userRestrictionRouter);
app.use(userConversationRouter);
const server = http.createServer(app);
const io = new Server(server);
setupSocket(io);

const startServer = async () => {
  try {
    if (!sequelizeInstance) {
      throw new Error("Sequelize instance not found. Please create!");
    }
    await sequelizeInstance.authenticate();
    syncAssociations();
    if(process.env.NODE_ENV!=="test"){
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  }
  } catch (error) {
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
