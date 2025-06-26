import express from "express";
import { storeOtpAndSendEmail } from "../otp/otp.controller";
import { checkDeleteStatus, checkStatus, contactDetails, deleteAccount, getProfileUrlsForPhoneNumbers, getUserByPhoneNumber, login, logout, refreshOrValidateAuth, register, update, verifyOtp } from "./user.controller";
import { authenticateToken, validateAndCheck, validateInputFields, validateLoginInputFields, validateLogOutInputFields, verifyUserDetails } from "./user.middleware";
export const userRouter = express.Router();

userRouter.post("/api/users", validateInputFields, register);
userRouter.post("/api/user", validateLoginInputFields, login);
userRouter.get("/api/user/:phoneNumber", authenticateToken,  getUserByPhoneNumber);
userRouter.post("/api/logout", validateLogOutInputFields, logout);
userRouter.post("/api/auth/validate", refreshOrValidateAuth);
userRouter.put("/api/user", authenticateToken, update);
userRouter.post("/api/deleteAccount",authenticateToken, deleteAccount);
userRouter.post("/api/users/contacts", authenticateToken, contactDetails);
userRouter.post("/api/users/online", authenticateToken, checkStatus);
userRouter.post("/api/users/deleted", authenticateToken, checkDeleteStatus);
userRouter.post("/api/getProfileUrls", getProfileUrlsForPhoneNumbers);
userRouter.post("/api/register/otp",validateAndCheck,storeOtpAndSendEmail);
userRouter.post("/api/auth/status",verifyUserDetails);
userRouter.post("/api/login/otp",storeOtpAndSendEmail);
userRouter.post('/api/verify-otp',verifyOtp)