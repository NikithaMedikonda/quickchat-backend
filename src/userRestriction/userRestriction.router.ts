import express from "express";
import { authenticateToken } from "../user/user.middleware";
import {
  blockUserAccount,
  unblockUserAccount,
} from "./userRestriction.controller";

export const userRestrictionRouter = express.Router();

userRestrictionRouter.post(
  "/api/block/users",
  authenticateToken,
  blockUserAccount
);
userRestrictionRouter.post(
  "/api/unblock/users",
  authenticateToken,
  unblockUserAccount
);
