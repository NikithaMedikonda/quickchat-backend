import express from "express";
import { deleteAccount, login, register, update } from "./user.controller";
import {
  authenticateToken,
  validateInputFields,
  validateLoginInputFields,
} from "./user.middleware";

export const userRouter = express.Router();

userRouter.post("/api/users", validateInputFields, register);
userRouter.post("/api/user", validateLoginInputFields, login);
userRouter.put("/api/user", authenticateToken, update);
userRouter.post("/api/deleteAccount",authenticateToken, deleteAccount);
