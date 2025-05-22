import express from "express";
import { authenticateToken } from "../user/user.middleware";
import {
  executeUserBlock,
  executeUserUnblock,
} from "./blocked-users.controller";

export const blockedUsersRouter = express.Router();

blockedUsersRouter.post(
  "/api/block/users",
  authenticateToken,
  executeUserBlock
);
blockedUsersRouter.post(
  "/api/unblock/users",
  authenticateToken,
  executeUserUnblock
);
