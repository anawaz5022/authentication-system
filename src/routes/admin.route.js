import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/authorization.middleware.js";

const router = Router();

router.get("/users", authenticate, requireRole("admin"), adminController.listUsers);

export default router;
