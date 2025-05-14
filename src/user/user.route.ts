import express from "express";
<<<<<<< HEAD
import { refreshOrValidateAuth, login, register, deleteAccount, update,} from "./user.controller";
=======
import { refreshOrValidateAuth, login, register, deleteAccount, update, contactDetails} from "./user.controller";
>>>>>>> 005675f0eaa8110a064fdfe1e25045fdd40b2988
import { authenticateToken, validateInputFields, validateLoginInputFields } from "./user.middleware";

export const userRouter = express.Router();

userRouter.post("/api/users", validateInputFields, register);
userRouter.post("/api/user", validateLoginInputFields, login);
userRouter.post("/api/auth/validate", refreshOrValidateAuth);
userRouter.put("/api/user", authenticateToken, update);
userRouter.post("/api/deleteAccount",authenticateToken, deleteAccount);
userRouter.post("/api/users/contacts", authenticateToken, contactDetails)