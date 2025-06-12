import express from "express";
import { refreshOrValidateAuth, login, register, deleteAccount, update, contactDetails, checkStatus,logout, checkDeleteStatus, getUserByPhoneNumber} from "./user.controller";
import { authenticateToken, validateInputFields, validateLoginInputFields, validateLogOutInputFields } from "./user.middleware";
export const userRouter = express.Router();

userRouter.post("/api/users", validateInputFields, register);
userRouter.post("/api/user", validateLoginInputFields, login);
userRouter.get("/api/user/:phoneNumber", authenticateToken, getUserByPhoneNumber);
userRouter.post("/api/logout", validateLogOutInputFields, logout);
userRouter.post("/api/auth/validate", refreshOrValidateAuth);
userRouter.put("/api/user", authenticateToken, update);
userRouter.post("/api/deleteAccount",authenticateToken, deleteAccount);
userRouter.post("/api/users/contacts", authenticateToken, contactDetails);
userRouter.post("/api/users/online", authenticateToken, checkStatus);
userRouter.post("/api/users/deleted", authenticateToken, checkDeleteStatus);