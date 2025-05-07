import express from "express";
import { register, login } from "./user.controller";
import { validateInputFields, validateLoginInputFields} from "./user.middleware";

const router = express.Router();

router.post("/api/users",validateInputFields,register);
router.post("/api/user",validateLoginInputFields, login);
export default router;