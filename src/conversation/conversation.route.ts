import express from "express";
import { authenticateToken } from "../user/user.middleware";
import { deleteConversation } from "./conversation.controller";

export const userConversationRouter = express.Router();

userConversationRouter.post(
  "/api/chat/delete",
  authenticateToken,
  deleteConversation
);
