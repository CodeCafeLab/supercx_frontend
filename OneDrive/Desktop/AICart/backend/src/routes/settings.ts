import { Router } from "express";
import { getSetting, getAllSettings, updateSetting, deleteSetting } from "../controllers/settingsController";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

// Public routes (for reading settings)
router.get("/", getAllSettings);
router.get("/:key", getSetting);

// Protected routes (admin only)
router.put("/:key", requireAuth, requireAdmin, updateSetting);
router.delete("/:key", requireAuth, requireAdmin, deleteSetting);

export default router;

