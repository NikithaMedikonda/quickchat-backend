import express from "express";
import { authenticateToken } from "../user/user.middleware";
import { insertContacts } from "./user_contacts.controller";

export const userContactsRouter = express.Router();
userContactsRouter.post(
  "/api/user/contacts",
  authenticateToken, insertContacts);