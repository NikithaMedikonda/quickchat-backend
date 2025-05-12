import express from "express";
import { register, login, update } from "./user.controller";
import {
  validateInputFields,
  validateLoginInputFields,
} from "./user.middleware";
import * as dotenv from "dotenv";

export const router = express.Router();

router.post("/api/users", validateInputFields, register);
router.post("/api/user", validateLoginInputFields, login);
router.put("/api/user", update);
