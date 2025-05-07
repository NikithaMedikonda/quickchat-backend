import express from "express";
import { register } from "./user.controller";
import { validateInputFields } from "./user.middleware";

const router = express.Router();

router.post("/api/users",validateInputFields,register);

export default router;