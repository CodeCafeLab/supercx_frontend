import { Router } from "express";
import {
  listLightingPresets,
  createLightingPreset,
  updateLightingPreset,
  deleteLightingPreset,
} from "../controllers/lightingController";
import { optionalAuth, requireAuth } from "../middleware/auth";

const router = Router();

// List all lighting presets (public)
router.get("/presets", optionalAuth, listLightingPresets);

// Create a new lighting preset (requires auth)
router.post("/presets", requireAuth, createLightingPreset);

// Update a lighting preset (requires auth)
router.put("/presets/:id", requireAuth, updateLightingPreset);

// Delete a lighting preset (requires auth)
router.delete("/presets/:id", requireAuth, deleteLightingPreset);

export default router;

