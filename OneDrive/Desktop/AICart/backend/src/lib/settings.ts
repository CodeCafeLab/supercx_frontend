import { prisma, dbAvailable } from "./prisma";

/**
 * Cache for settings (refresh every 5 minutes)
 */
let settingsCache: Record<string, any> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Default settings
 */
const DEFAULT_SETTINGS: Record<string, any> = {
  "features.avatars.enabled": true,
  "features.avatars.ai_generation.enabled": true,
  "features.library.enabled": true,
  "features.library.backgrounds.enabled": true,
  "features.library.props.enabled": true,
  "features.projects.enabled": true,
  "features.animation.enabled": true,
  "features.art_director.enabled": true,
  "features.virtual_shoot.enabled": true,
  "avatars.default_gender_options": ["Female", "Male", "Neutral"],
  "avatars.default_style_options": ["Casual", "Formal", "Urban", "Sporty"],
  "avatars.default_color_options": [],
  "avatars.default_accent_color": "#FFB400",
  "library.backgrounds.default_categories": ["Studio", "Indoor", "Luxury", "Urban"],
  "library.props.default_categories": ["Studio", "Indoor", "Luxury", "Urban"],
  "users.default_credits": 100,
  "users.default_admin_credits": 1000,

  // Product mode settings
  "features.product_mode.enabled": true,
  "product_mode.default_aspect_ratios": ["1:1", "4:5", "16:9", "3:4", "9:16"],
  "product_mode.default_shadow": 40,
  "product_mode.default_reflection": 20,
  "product_mode.allowed_file_types": ["image/png", "image/jpeg", "image/jpg", "image/webp"],
  "product_mode.max_file_size_mb": 10,
};

/**
 * Get a setting value
 */
export async function getSetting(key: string): Promise<any> {
  // Check cache first
  if (settingsCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return settingsCache[key] ?? DEFAULT_SETTINGS[key] ?? null;
  }

  if (!dbAvailable) {
    return DEFAULT_SETTINGS[key] ?? null;
  }

  try {
    const settings = await prisma.admin_settings.findMany();
    settingsCache = {};
    settings.forEach((s) => {
      settingsCache![s.key] = s.value;
    });

    // Merge with defaults
    Object.keys(DEFAULT_SETTINGS).forEach((k) => {
      if (!settingsCache![k]) {
        settingsCache![k] = DEFAULT_SETTINGS[k];
      }
    });

    cacheTimestamp = Date.now();
    return settingsCache[key] ?? DEFAULT_SETTINGS[key] ?? null;
  } catch (error) {
    console.error("Error fetching settings:", error);
    return DEFAULT_SETTINGS[key] ?? null;
  }
}

/**
 * Get multiple settings at once
 */
export async function getSettings(keys: string[]): Promise<Record<string, any>> {
  const result: Record<string, any> = {};
  for (const key of keys) {
    result[key] = await getSetting(key);
  }
  return result;
}

/**
 * Check if a feature is enabled
 */
export async function isFeatureEnabled(feature: string): Promise<boolean> {
  const value = await getSetting(`features.${feature}.enabled`);
  return value === true;
}

/**
 * Invalidate settings cache (call after updating settings)
 */
export function invalidateSettingsCache() {
  settingsCache = null;
  cacheTimestamp = 0;
}

