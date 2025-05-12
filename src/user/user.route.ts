import express from "express";
import { login, register,deleteAccount } from "./user.controller";
import { validateInputFields, validateLoginInputFields , authenticateToken} from "./user.middleware";

export const userRouter = express.Router();

userRouter.post("/api/users", validateInputFields, register);
userRouter.post("/api/user", validateLoginInputFields, login);
userRouter.post("/api/deleteAccount",authenticateToken, deleteAccount);