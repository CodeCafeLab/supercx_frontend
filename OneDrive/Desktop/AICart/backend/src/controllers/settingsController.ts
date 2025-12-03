import { Request, Response } from "express";
import { prisma, dbAvailable } from "../lib/prisma";

/**
 * Get a setting value by key
 */
export async function getSetting(req: Request, res: Response) {
  const { key } = req.params;
  if (!key) return res.status(400).json({ error: "invalid_input" });

  if (!dbAvailable) {
    // Return default values for dev mode
    return res.json({ key, value: getDefaultSetting(key) });
  }

  try {
    const setting = await prisma.admin_settings.findUnique({
      where: { key },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!setting) {
      // Return default if not found
      return res.json({ key, value: getDefaultSetting(key) });
    }

    return res.json({ key, value: setting.value, updated_by: setting.user, updated_at: setting.updated_at });
  } catch (error) {
    console.error("Error fetching setting:", error);
    return res.status(500).json({ error: "internal_server_error" });
  }
}

/**
 * Get all settings
 */
export async function getAllSettings(req: Request, res: Response) {
  if (!dbAvailable) {
    return res.json({ settings: getAllDefaultSettings() });
  }

  try {
    const settings = await prisma.admin_settings.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { key: "asc" },
    });

    const settingsMap: Record<string, any> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    // Merge with defaults for missing keys
    const defaults = getAllDefaultSettings();
    Object.keys(defaults).forEach((key) => {
      if (!settingsMap[key]) {
        settingsMap[key] = defaults[key];
      }
    });

    return res.json({ settings: settingsMap });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return res.status(500).json({ error: "internal_server_error" });
  }
}

/**
 * Update or create a setting
 */
export async function updateSetting(req: Request, res: Response) {
  const { key } = req.params;
  const { value } = req.body;
  const userId = (req as any).userId; // From auth middleware

  if (!key || value === undefined) {
    return res.status(400).json({ error: "invalid_input" });
  }

  if (!dbAvailable) {
    return res.json({ key, value, message: "Setting updated (dev mode)" });
  }

  try {
    // Validate value based on key
    const validatedValue = validateSettingValue(key, value);
    if (!validatedValue) {
      return res.status(400).json({ error: "invalid_value" });
    }

    const setting = await prisma.admin_settings.upsert({
      where: { key },
      update: {
        value: validatedValue,
        updated_by: userId || "system",
        updated_at: new Date(),
      },
      create: {
        key,
        value: validatedValue,
        updated_by: userId || "system",
      },
    });

    // Invalidate cache after update
    const { invalidateSettingsCache } = await import("../lib/settings");
    invalidateSettingsCache();

    return res.json({ key, value: setting.value, updated_at: setting.updated_at });
  } catch (error) {
    console.error("Error updating setting:", error);
    return res.status(500).json({ error: "internal_server_error" });
  }
}

/**
 * Delete a setting (revert to default)
 */
export async function deleteSetting(req: Request, res: Response) {
  const { key } = req.params;

  if (!dbAvailable) {
    return res.json({ key, message: "Setting deleted (dev mode)" });
  }

  try {
    await prisma.admin_settings.delete({ where: { key } });
    return res.json({ key, message: "Setting deleted, will use default" });
  } catch (error) {
    console.error("Error deleting setting:", error);
    return res.status(500).json({ error: "internal_server_error" });
  }
}

/**
 * Get default setting value
 */
function getDefaultSetting(key: string): any {
  const defaults = getAllDefaultSettings();
  return defaults[key] ?? null;
}

/**
 * Get all default settings
 */
function getAllDefaultSettings(): Record<string, any> {
  return {
    // Feature toggles
    "features.avatars.enabled": true,
    "features.avatars.ai_generation.enabled": true,
    "features.library.enabled": true,
    "features.library.backgrounds.enabled": true,
    "features.library.props.enabled": true,
    "features.scenes.enabled": true,
    "features.scenes.generator.enabled": true,
    "features.projects.enabled": true,
    "features.animation.enabled": true,
    "features.art_director.enabled": true,
    "features.virtual_shoot.enabled": true,
    "features.lighting.enabled": true,

    // Avatar defaults
    "avatars.default_gender_options": ["Female", "Male", "Neutral"],
    "avatars.default_style_options": ["Casual", "Formal", "Urban", "Sporty"],
    "avatars.default_color_options": [],
    "avatars.default_accent_color": "#FFB400",

    // Library defaults
    "library.backgrounds.default_categories": ["Studio", "Indoor", "Luxury", "Urban"],
    "library.props.default_categories": ["Studio", "Indoor", "Luxury", "Urban"],

    // Scene defaults
    "scenes.default_categories": ["All", "Studio", "Outdoor", "Luxury", "Indoor", "Urban", "Nature"],

    // Project defaults
    "projects.default_types": ["All", "Product Shoot", "Campaign", "Ad Creative", "Animation"],

    // Animation defaults
    "animation.default_types": ["Fade In", "Slide", "Zoom", "Rotate", "Bounce"],

    // Art Director defaults
    "art_director.default_style_categories": ["Minimalist", "Luxury", "Urban", "Natural", "Industrial"],

    // Packs defaults
    "packs.default_categories": ["All", "Studio", "Lifestyle", "Premium", "Motion"],

    // Props defaults
    "props.default_categories": ["All", "Furniture", "Plant", "Lighting", "Tech"],

    // User settings
    "users.default_credits": 100,
    "users.default_admin_credits": 1000,

    // UI Settings
    "ui.show_beta_features": false,
    "ui.maintenance_mode": false,
    "ui.maintenance_message": "We're currently performing maintenance. Please check back soon.",

    // Product mode settings
    "features.product_mode.enabled": true,
    "product_mode.default_aspect_ratios": ["1:1", "4:5", "16:9", "3:4", "9:16"],
    "product_mode.default_shadow": 40,
    "product_mode.default_reflection": 20,
    "product_mode.allowed_file_types": ["image/png", "image/jpeg", "image/jpg", "image/webp"],
    "product_mode.max_file_size_mb": 10,
  };
}

/**
 * Validate setting value based on key
 */
function validateSettingValue(key: string, value: any): any {
  // Boolean validation
  if (key.includes(".enabled") || key.includes("show_") || key.includes("maintenance_mode")) {
    return typeof value === "boolean" ? value : Boolean(value);
  }

  // Array validation
  if (key.includes("_options") || key.includes("_categories") || key.includes("_types")) {
    return Array.isArray(value) ? value : [];
  }

  // Number validation
  if (key.includes("credits") || key.includes("_count") || key.includes("_limit")) {
    return typeof value === "number" && value >= 0 ? value : 0;
  }

  // String validation
  if (key.includes("message") || key.includes("_text") || key.includes("_name")) {
    return typeof value === "string" ? value : String(value);
  }

  // Default: return as-is
  return value;
}

