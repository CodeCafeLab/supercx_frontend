import { Router } from "express";
import { listAvatars, createAvatar, deleteAvatar, generateAvatar, listAvatarCategories } from "../controllers/avatarController";
import { optionalAuth } from "../middleware/auth";

const router = Router();

// All routes use optionalAuth to get userId if available, but don't require it
router.get("/", optionalAuth, listAvatars);
router.get("/categories", listAvatarCategories);
router.post("/", optionalAuth, createAvatar);
router.post("/generate", optionalAuth, generateAvatar);
router.delete("/:id", optionalAuth, deleteAvatar);

export default router;