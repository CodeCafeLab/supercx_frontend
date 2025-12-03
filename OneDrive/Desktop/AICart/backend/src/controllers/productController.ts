import { Request, Response } from "express";
import { prisma, dbAvailable } from "../lib/prisma";
import { getSetting, isFeatureEnabled } from "../lib/settings";

/**
 * Process product image - background removal
 */
export async function processProductImage(req: Request, res: Response) {
  // Check if product mode feature is enabled
  const enabled = await isFeatureEnabled("product_mode");
  if (!enabled) {
    return res.status(403).json({ error: "feature_disabled", message: "Product mode is currently disabled" });
  }

  const { imageData, shadowValue, reflectionValue, aspectRatio } = req.body || {};

  if (!imageData || typeof imageData !== "string") {
    return res.status(400).json({ error: "invalid_input", message: "Image data is required" });
  }

  // Always require database
  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  try {
    // In a real implementation, you would:
    // 1. Decode base64 image
    // 2. Process with background removal service (e.g., Remove.bg API, custom ML model)
    // 3. Apply shadow/reflection effects
    // 4. Resize/crop to aspect ratio
    // 5. Return processed image

    // For now, we'll simulate processing and return the image
    // TODO: Integrate with actual background removal service
    
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In production, process the image here
    // For now, return the original image (in real implementation, return processed)
    const processedImageData = imageData; // Replace with actual processed image

    // Always save to database
    const userId = (req as any).userId;
    const asset = await (prisma as any).assets.create({
      data: {
        user_id: userId || undefined,
        type: "product_processed",
        url: processedImageData,
        metadata: {
          shadowValue: shadowValue || 0,
          reflectionValue: reflectionValue || 0,
          aspectRatio: aspectRatio || "1:1",
          processed_at: new Date().toISOString(),
        },
      },
    });

    return res.json({
      success: true,
      processedImage: processedImageData,
      assetId: asset.id,
      metadata: {
        shadowValue: shadowValue || 0,
        reflectionValue: reflectionValue || 0,
        aspectRatio: aspectRatio || "1:1",
      },
    });
  } catch (error) {
    console.error("Error processing product image:", error);
    return res.status(500).json({ error: "processing_failed", message: "Failed to process image" });
  }
}

/**
 * Get product processing history
 */
export async function getProductHistory(req: Request, res: Response) {
  const enabled = await isFeatureEnabled("product_mode");
  if (!enabled) {
    return res.status(403).json({ error: "feature_disabled" });
  }

  // Always require database
  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  const userId = (req as any).userId;
  if (!userId) {
    return res.status(401).json({ error: "unauthorized", message: "Authentication required" });
  }

  try {
    const items = await (prisma as any).assets.findMany({
      where: {
        user_id: userId,
        type: "product_processed",
      },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    return res.json({
      items: items.map((item: any) => ({
        id: item.id,
        url: item.url,
        metadata: item.metadata,
        created_at: item.created_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching product history:", error);
    return res.status(500).json({ error: "internal_server_error", message: "Failed to fetch history" });
  }
}

/**
 * Delete processed product image
 */
export async function deleteProductImage(req: Request, res: Response) {
  const { id } = req.params;
  const userId = (req as any).userId;

  if (!id) {
    return res.status(400).json({ error: "invalid_input", message: "Asset ID is required" });
  }

  // Always require database
  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  try {
    // Verify ownership
    const asset = await (prisma as any).assets.findUnique({
      where: { id },
    });

    if (!asset) {
      return res.status(404).json({ error: "not_found", message: "Asset not found" });
    }

    // Verify ownership if user is authenticated
    if (userId && asset.user_id && asset.user_id !== userId) {
      return res.status(403).json({ error: "forbidden", message: "You don't have permission to delete this asset" });
    }

    await (prisma as any).assets.delete({ where: { id } });

    return res.json({ ok: true, message: "Asset deleted successfully" });
  } catch (error) {
    console.error("Error deleting product image:", error);
    return res.status(500).json({ error: "internal_server_error", message: "Failed to delete asset" });
  }
}

