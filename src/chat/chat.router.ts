import express from "express";
import { authenticateToken } from "../user/user.middleware";
import { userChats } from "./chat.controller";

export const chatRouter = express.Router();

chatRouter.post("/api/users/messages", authenticateToken, userChats);
