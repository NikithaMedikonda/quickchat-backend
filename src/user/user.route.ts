import express from "express";
import { checkAuth, login, register, deleteAccount, update } from "./user.controller";
import { authenticateToken, validateInputFields, validateLoginInputFields } from "./user.middleware";

export const userRouter = express.Router();

userRouter.post("/api/users", validateInputFields, register);
userRouter.post("/api/user", validateLoginInputFields, login);
userRouter.post("/api/checkAuth", checkAuth);
userRouter.put("/api/user", authenticateToken, update);
userRouter.post("/api/deleteAccount",authenticateToken, deleteAccount);
