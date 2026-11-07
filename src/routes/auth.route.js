import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import * as userController from "../controllers/user.controller.js";

const router = Router();

// POST /api/auth/register
router.post("/register", authController.register);

// POST /api/auth/login
router.post("/login", authController.login);

// GET /api/auth/get-me
router.get("/get-me", authenticate, userController.getMe);

//GET /api/auth/refresh-token
router.get("/refresh-token", authController.refreshToken);

//GET /api/auth/logout
router.get("/logout", authController.logout);

//GET /api/auth/logout-all
router.get("/logout-all", authController.logoutAll);

export default router;