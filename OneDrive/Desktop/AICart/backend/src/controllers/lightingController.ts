import { Request, Response } from "express";
import { prisma, dbAvailable } from "../lib/prisma";
import { isFeatureEnabled } from "../lib/settings";

type LightingPreset = {
  id: string;
  name: string;
  intensity: number;
  temperature: number;
  softness: number;
  shadow: number;
  direction?: string;
  image_url?: string;
  metadata?: Record<string, any>;
  created_at: Date;
};

/**
 * List all lighting presets
 */
export async function listLightingPresets(req: Request, res: Response) {
  // Check if lighting feature is enabled
  const enabled = await isFeatureEnabled("lighting");
  if (!enabled) {
    return res.status(403).json({ error: "feature_disabled", message: "Lighting feature is currently disabled" });
  }

  // Always require database
  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  try {
    const search = (req.query.search as string)?.trim();
    const limitParam = parseInt((req.query.limit as string) || "50", 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 50;

    const where: any = { type: "lighting_preset" };
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const items = await (prisma as any).assets.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: limit,
    });

    // Transform assets to lighting preset format
    const presets = items.map((item: any) => {
      const metadata = item.metadata || {};
      return {
        id: item.id,
        name: item.metadata?.name || item.url || "Unnamed Preset",
        intensity: metadata.intensity ?? 60,
        temperature: metadata.temperature ?? 5200,
        softness: metadata.softness ?? 60,
        shadow: metadata.shadow ?? 40,
        direction: metadata.direction || "front",
        image_url: item.url || metadata.image_url,
        metadata: metadata,
        created_at: item.created_at,
      };
    });

    return res.json({ items: presets });
  } catch (error) {
    console.error("Error listing lighting presets:", error);
    return res.status(500).json({ error: "internal_server_error", message: "Failed to fetch lighting presets" });
  }
}

/**
 * Create a new lighting preset
 */
export async function createLightingPreset(req: Request, res: Response) {
  const enabled = await isFeatureEnabled("lighting");
  if (!enabled) {
    return res.status(403).json({ error: "feature_disabled", message: "Lighting feature is currently disabled" });
  }

  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  const { name, intensity, temperature, softness, shadow, direction, image_url } = req.body || {};

  if (!name) {
    return res.status(400).json({ error: "invalid_input", message: "Name is required" });
  }

  try {
    const userId = (req as any).userId;

    const preset = await (prisma as any).assets.create({
      data: {
        user_id: userId || undefined,
        type: "lighting_preset",
        url: image_url || "",
        metadata: {
          name,
          intensity: intensity ?? 60,
          temperature: temperature ?? 5200,
          softness: softness ?? 60,
          shadow: shadow ?? 40,
          direction: direction || "front",
          image_url: image_url || undefined,
        },
      },
    });

    const item = {
      id: preset.id,
      name,
      intensity: preset.metadata.intensity,
      temperature: preset.metadata.temperature,
      softness: preset.metadata.softness,
      shadow: preset.metadata.shadow,
      direction: preset.metadata.direction,
      image_url: preset.metadata.image_url || preset.url,
      metadata: preset.metadata,
      created_at: preset.created_at,
    };

    return res.status(201).json({ item });
  } catch (error) {
    console.error("Error creating lighting preset:", error);
    return res.status(500).json({ error: "internal_server_error", message: "Failed to create lighting preset" });
  }
}

/**
 * Update a lighting preset
 */
export async function updateLightingPreset(req: Request, res: Response) {
  const { id } = req.params;
  const { name, intensity, temperature, softness, shadow, direction, image_url } = req.body || {};

  if (!id) {
    return res.status(400).json({ error: "invalid_input", message: "Preset ID is required" });
  }

  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  try {
    const userId = (req as any).userId;

    // Check if preset exists
    const existing = await (prisma as any).assets.findUnique({
      where: { id },
    });

    if (!existing || existing.type !== "lighting_preset") {
      return res.status(404).json({ error: "not_found", message: "Lighting preset not found" });
    }

    // Verify ownership if user is authenticated
    if (userId && existing.user_id && existing.user_id !== userId) {
      return res.status(403).json({ error: "forbidden", message: "You don't have permission to update this preset" });
    }

    const currentMetadata = existing.metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      ...(name !== undefined && { name }),
      ...(intensity !== undefined && { intensity }),
      ...(temperature !== undefined && { temperature }),
      ...(softness !== undefined && { softness }),
      ...(shadow !== undefined && { shadow }),
      ...(direction !== undefined && { direction }),
      ...(image_url !== undefined && { image_url }),
    };

    const preset = await (prisma as any).assets.update({
      where: { id },
      data: {
        url: image_url || existing.url,
        metadata: updatedMetadata,
      },
    });

    const item = {
      id: preset.id,
      name: preset.metadata.name || preset.url,
      intensity: preset.metadata.intensity,
      temperature: preset.metadata.temperature,
      softness: preset.metadata.softness,
      shadow: preset.metadata.shadow,
      direction: preset.metadata.direction,
      image_url: preset.metadata.image_url || preset.url,
      metadata: preset.metadata,
      created_at: preset.created_at,
    };

    return res.json({ item });
  } catch (error: any) {
    console.error("Error updating lighting preset:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "not_found", message: "Lighting preset not found" });
    }
    return res.status(500).json({ error: "internal_server_error", message: "Failed to update lighting preset" });
  }
}

/**
 * Delete a lighting preset
 */
export async function deleteLightingPreset(req: Request, res: Response) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "invalid_input", message: "Preset ID is required" });
  }

  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  try {
    const userId = (req as any).userId;

    // Check if preset exists
    const preset = await (prisma as any).assets.findUnique({
      where: { id },
    });

    if (!preset || preset.type !== "lighting_preset") {
      return res.status(404).json({ error: "not_found", message: "Lighting preset not found" });
    }

    // Verify ownership if user is authenticated
    if (userId && preset.user_id && preset.user_id !== userId) {
      return res.status(403).json({ error: "forbidden", message: "You don't have permission to delete this preset" });
    }

    await (prisma as any).assets.delete({ where: { id } });

    return res.json({ ok: true, message: "Lighting preset deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting lighting preset:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "not_found", message: "Lighting preset not found" });
    }
    return res.status(500).json({ error: "internal_server_error", message: "Failed to delete lighting preset" });
  }
}

