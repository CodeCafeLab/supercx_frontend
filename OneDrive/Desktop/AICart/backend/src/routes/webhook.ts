import { Router } from "express";
import {
  createWebhookJob,
  updateWebhookJob,
  getWebhookJobStatus,
} from "../controllers/webhookController";
import { optionalAuth } from "../middleware/auth";

const router = Router();

// Create a new webhook job (requires auth for tracking, but optional for flexibility)
router.post("/jobs", optionalAuth, createWebhookJob);

// Update webhook job status (called by n8n after processing)
router.put("/jobs/:jobId", updateWebhookJob);

// Get webhook job status
router.get("/jobs/:jobId", optionalAuth, getWebhookJobStatus);

export default router;

