import { Router } from "express";
import { processProductImage, getProductHistory, deleteProductImage } from "../controllers/productController";
import { optionalAuth, requireAuth } from "../middleware/auth";

const router = Router();

// Process product image (optional auth - can work without login)
router.post("/process", optionalAuth, processProductImage);

// Get history (requires auth)
router.get("/history", requireAuth, getProductHistory);

// Delete processed image (requires auth)
router.delete("/:id", requireAuth, deleteProductImage);

export default router;

