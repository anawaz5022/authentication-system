import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

// POST /api/auth/register
router.post("/register", authController.register);

// GET /api/auth/get-me
router.get("/get-me", authController.getMe);


export default router;