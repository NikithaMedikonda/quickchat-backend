import express from "express";
import { checkAuth, login, register } from "./user.controller";
import { validateInputFields, validateLoginInputFields } from "./user.middleware";

export const userRouter = express.Router();

userRouter.post("/api/users", validateInputFields, register);
userRouter.post("/api/user", validateLoginInputFields, login);
userRouter.post("/api/checkAuth", checkAuth);
