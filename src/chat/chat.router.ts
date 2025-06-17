import express from "express";
import { authenticateToken } from "../user/user.middleware";
import { getChatsOfUser, getDataOfuser, getMessagesForSync, userChats } from "./chat.controller";

export const chatRouter = express.Router();

chatRouter.post("/api/users/messages", authenticateToken, userChats);
chatRouter.post("/api/chats/user", authenticateToken, getChatsOfUser);
chatRouter.post("/api/sync",authenticateToken, getMessagesForSync)
chatRouter.post("/api/user/messages",authenticateToken,getDataOfuser);