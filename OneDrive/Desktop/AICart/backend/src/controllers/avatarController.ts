import { Request, Response } from "express";
import { prisma, dbAvailable } from "../lib/prisma";
import { getSetting, isFeatureEnabled } from "../lib/settings";

const AVATAR_SCOPE = "avatar";

type AvatarCategory = {
  id: string;
  name: string;
  category_group: string;
  scope: string;
};

type CategorySeed = {
  scope: string;
  group: string;
  name: string;
  description?: string;
};

type AvatarResponseItem = {
  id: string;
  name: string;
  gender?: string;
  style?: string;
  color?: string;
  image_url?: string;
  categories?: AvatarCategory[];
};

type DevAvatar = {
  id: string;
  user_id: string;
  name: string;
  gender?: string;
  style?: string;
  color?: string;
  source_type: string;
  status: string;
  image_url?: string;
  metadata?: Record<string, any>;
  categories: AvatarCategory[];
  created_at: Date;
};

const devAvatars: DevAvatar[] = [];

function genId() {
  return "av-" + Math.random().toString(36).slice(2, 10);
}

function slugify(value: string) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildCategorySlug(scope: string, group: string, name: string) {
  return `${slugify(scope)}-${slugify(group)}-${slugify(name)}`;
}

function normalizeSeed(seed: CategorySeed): CategorySeed | null {
  if (!seed || typeof seed.name !== "string") return null;
  const name = seed.name.trim();
  if (!name) return null;
  const scope = (seed.scope || AVATAR_SCOPE).trim().toLowerCase() || AVATAR_SCOPE;
  const group = (seed.group || "custom").trim().toLowerCase() || "custom";
  const description =
    typeof seed.description === "string" && seed.description.trim().length > 0
      ? seed.description.trim()
      : undefined;
  return { scope, group, name, description };
}

function buildDevCategories({
  gender,
  style,
}: {
  gender?: string;
  style?: string;
}): AvatarCategory[] {
  const categories: AvatarCategory[] = [];
  if (gender) {
    categories.push({
      id: `dev-${buildCategorySlug(AVATAR_SCOPE, "gender", gender)}`,
      name: gender,
      category_group: "gender",
      scope: AVATAR_SCOPE,
    });
  }
  if (style) {
    categories.push({
      id: `dev-${buildCategorySlug(AVATAR_SCOPE, "style", style)}`,
      name: style,
      category_group: "style",
      scope: AVATAR_SCOPE,
    });
  }
  return categories;
}

function normalizeCustomCategoryInput(input: any): CategorySeed[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((value) => {
      if (typeof value === "string") {
        return normalizeSeed({ scope: AVATAR_SCOPE, group: "custom", name: value });
      }
      if (value && typeof value === "object" && typeof value.name === "string") {
        return normalizeSeed({
          scope: typeof value.scope === "string" ? value.scope : AVATAR_SCOPE,
          group: typeof value.group === "string" ? value.group : "custom",
          name: value.name,
          description: typeof value.description === "string" ? value.description : undefined,
        });
      }
      return null;
    })
    .filter((seed): seed is CategorySeed => !!seed);
}

async function resolveCategoryRecords({
  ids,
  seeds,
}: {
  ids?: string[];
  seeds?: CategorySeed[];
}): Promise<AvatarCategory[]> {
  const normalizedIds = Array.isArray(ids)
    ? Array.from(new Set(ids.filter((id) => typeof id === "string" && id.trim().length > 0)))
    : [];
  const records: AvatarCategory[] = [];

  if (normalizedIds.length > 0) {
    const existing = await (prisma as any).model_categories.findMany({
      where: { id: { in: normalizedIds } },
    });
    existing.forEach((cat: any) => {
      records.push({
        id: cat.id,
        name: cat.name,
        category_group: cat.category_group,
        scope: cat.scope,
      });
    });
  }

  const seedMap = new Map<string, CategorySeed>();
  (seeds || []).forEach((seed) => {
    const normalized = normalizeSeed(seed);
    if (!normalized) return;
    const slug = buildCategorySlug(normalized.scope, normalized.group, normalized.name);
    if (!seedMap.has(slug)) {
      seedMap.set(slug, normalized);
    }
  });

  if (seedMap.size > 0) {
    const upserts = await Promise.all(
      Array.from(seedMap.entries()).map(([slug, seed]) =>
        (prisma as any).model_categories.upsert({
          where: { slug },
          update: { name: seed.name, description: seed.description },
          create: {
            scope: seed.scope,
            category_group: seed.group,
            name: seed.name,
            slug,
            description: seed.description,
          },
        })
      )
    );
    upserts.forEach((cat: any) => {
      records.push({
        id: cat.id,
        name: cat.name,
        category_group: cat.category_group,
        scope: cat.scope,
      });
    });
  }

  return records;
}

async function attachCategoriesToModel(modelId: string, categories: AvatarCategory[]) {
  if (!categories.length) return;
  await (prisma as any).model_category_links.createMany({
    data: categories.map((cat) => ({
      model_id: modelId,
      category_id: cat.id,
    })),
    skipDuplicates: true,
  });
}

async function hydrateAvatar(modelId: string): Promise<AvatarResponseItem | null> {
  const row = await (prisma as any).ai_models.findUnique({
    where: { id: modelId },
    include: {
      category_links: {
        include: { category: true },
      },
    },
  });
  return mapAvatarRow(row);
}

function mapAvatarRow(row: any): AvatarResponseItem | null {
  if (!row) return null;
  const categories =
    row.category_links?.map((link: any) => link?.category).filter(Boolean).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      category_group: cat.category_group,
      scope: cat.scope,
    })) || [];
  return {
    id: row.id,
    name: row.name,
    gender: row.metadata?.gender,
    style: row.metadata?.style,
    color: row.metadata?.color,
    image_url: row.model_url,
    categories,
  };
}

function mapDevAvatar(avatar: DevAvatar): AvatarResponseItem {
  return {
    id: avatar.id,
    name: avatar.name,
    gender: avatar.gender,
    style: avatar.style,
    color: avatar.color,
    image_url: avatar.image_url,
    categories: avatar.categories,
  };
}

function buildDevCategoryList(scope: string, group?: string) {
  const scoped = devAvatars
    .flatMap((avatar) => avatar.categories)
    .filter((cat) => cat.scope === scope && (!group || cat.category_group === group));
  const unique = new Map<string, AvatarCategory>();
  scoped.forEach((cat) => {
    unique.set(cat.id, cat);
  });
  return Array.from(unique.values());
}

export async function listAvatars(req: Request, res: Response) {
  // Check if avatars feature is enabled
  const enabled = await isFeatureEnabled("avatars");
  if (!enabled) {
    return res.status(403).json({ error: "feature_disabled", message: "Avatars feature is currently disabled" });
  }

  // Always use database - no dev fallback
  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  try {
    const userId = (req as any).userId;
    const where: any = { type: "avatar" };
    
    // Optionally filter by user if authenticated
    // For now, show all avatars (can be changed to user-specific if needed)
    
    const rows = await (prisma as any).ai_models.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: {
        category_links: {
          include: { category: true },
        },
      },
    });
    const items = rows.map((row: any) => mapAvatarRow(row)).filter(Boolean);
    return res.json({ items });
  } catch (error) {
    console.error("Error listing avatars:", error);
    return res.status(500).json({ error: "internal_server_error", message: "Failed to fetch avatars" });
  }
}

export async function createAvatar(req: Request, res: Response) {
  // Always require database
  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  const {
    name,
    gender,
    style,
    color,
    source_type,
    imageUrl,
    imageData,
    userId,
    metadata,
    categoryIds,
    categories,
  } = req.body || {};

  // Get user_id from auth middleware or request body
  const user_id = (req as any).userId || (typeof userId === "string" && userId.trim().length > 0 ? userId : null);

  if (!name || !source_type) {
    return res.status(400).json({ error: "invalid_input", message: "Name and source_type are required" });
  }

  try {
    let finalImageUrl: string | undefined = imageUrl;
    
    // Save image as asset if imageData is provided
    if (imageData && typeof imageData === "string") {
      const asset = await (prisma as any).assets.create({
        data: {
          user_id: user_id || undefined,
          type: "avatar",
          url: imageData,
        },
      });
      finalImageUrl = asset.url;
    }

    // Create avatar model in database
    const row = await (prisma as any).ai_models.create({
      data: {
        user_id: user_id || undefined,
        name,
        type: "avatar",
        status: "active",
        model_url: finalImageUrl,
        metadata: { gender, style, color, source_type, ...(metadata || {}) },
      },
    });

    // Create and attach categories
    const derivedSeeds: CategorySeed[] = [];
    if (gender) derivedSeeds.push({ scope: AVATAR_SCOPE, group: "gender", name: gender });
    if (style) derivedSeeds.push({ scope: AVATAR_SCOPE, group: "style", name: style });
    const customSeeds = normalizeCustomCategoryInput(categories);
    const categoryRecords = await resolveCategoryRecords({
      ids: categoryIds,
      seeds: [...derivedSeeds, ...customSeeds],
    });
    await attachCategoriesToModel(row.id, categoryRecords);

    const item = await hydrateAvatar(row.id);
    return res.status(201).json({ item });
  } catch (error) {
    console.error("Error creating avatar:", error);
    return res.status(500).json({ error: "internal_server_error", message: "Failed to create avatar" });
  }
}

export async function deleteAvatar(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "invalid_input", message: "Avatar ID is required" });
  }

  // Always require database
  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  try {
    const userId = (req as any).userId;
    
    // Check if avatar exists and optionally verify ownership
    const avatar = await (prisma as any).ai_models.findUnique({
      where: { id },
    });

    if (!avatar) {
      return res.status(404).json({ error: "not_found", message: "Avatar not found" });
    }

    // Optional: Verify ownership if user is authenticated
    // For now, allow deletion if user is authenticated or if no user_id on avatar
    if (userId && avatar.user_id && avatar.user_id !== userId) {
      return res.status(403).json({ error: "forbidden", message: "You don't have permission to delete this avatar" });
    }

    // Delete category links first (cascade should handle this, but being explicit)
    await (prisma as any).model_category_links.deleteMany({ where: { model_id: id } }).catch(() => {});
    
    // Delete the avatar
    await (prisma as any).ai_models.delete({ where: { id } });
    
    return res.json({ ok: true, message: "Avatar deleted successfully" });
  } catch (error) {
    console.error("Error deleting avatar:", error);
    return res.status(500).json({ error: "internal_server_error", message: "Failed to delete avatar" });
  }
}

export async function generateAvatar(req: Request, res: Response) {
  // Check if AI generation is enabled
  const aiEnabled = await isFeatureEnabled("avatars.ai_generation");
  if (!aiEnabled) {
    return res.status(403).json({ error: "feature_disabled", message: "AI avatar generation is currently disabled" });
  }

  // Always require database
  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  const { prompt, style, gender, color, userId, name, categoryIds, categories } = req.body || {};
  
  // Get user_id from auth middleware or request body
  const user_id = (req as any).userId || (typeof userId === "string" && userId.trim().length > 0 ? userId : null);
  
  const avatarName = name || "AI Avatar";
  const seed = encodeURIComponent((prompt || style || avatarName || "avatar") + Date.now());
  const imageUrl = `https://picsum.photos/seed/${seed}/600/800`;

  try {
    // Create avatar model in database
    const row = await (prisma as any).ai_models.create({
      data: {
        user_id: user_id || undefined,
        name: avatarName,
        type: "avatar",
        status: "active",
        model_url: imageUrl,
        metadata: { 
          gender, 
          style, 
          color, 
          source_type: "ai",
          prompt: prompt || undefined,
          generated_at: new Date().toISOString(),
        },
      },
    });

    // Create and attach categories
    const derivedSeeds: CategorySeed[] = [];
    if (gender) derivedSeeds.push({ scope: AVATAR_SCOPE, group: "gender", name: gender });
    if (style) derivedSeeds.push({ scope: AVATAR_SCOPE, group: "style", name: style });
    const customSeeds = normalizeCustomCategoryInput(categories);
    const categoryRecords = await resolveCategoryRecords({
      ids: categoryIds,
      seeds: [...derivedSeeds, ...customSeeds],
    });
    await attachCategoriesToModel(row.id, categoryRecords);

    const item = await hydrateAvatar(row.id);
    return res.status(201).json({ item });
  } catch (error) {
    console.error("Error generating avatar:", error);
    return res.status(500).json({ error: "internal_server_error", message: "Failed to generate avatar" });
  }
}

export async function listAvatarCategories(req: Request, res: Response) {
  const scope = ((req.query.scope as string) || AVATAR_SCOPE).toLowerCase();
  const group = (req.query.group as string | undefined)?.toLowerCase();
  
  // Get default options from settings
  let defaultOptions: string[] = [];
  if (group === "gender") {
    defaultOptions = (await getSetting("avatars.default_gender_options")) || [];
  } else if (group === "style") {
    defaultOptions = (await getSetting("avatars.default_style_options")) || [];
  }

  // Always use database - no dev fallback
  if (!dbAvailable) {
    // Return defaults if database unavailable
    if (defaultOptions.length > 0) {
      return res.json({
        items: defaultOptions.map((name) => ({
          id: `default-${name.toLowerCase()}`,
          name,
          category_group: group || "custom",
          scope,
        })),
      });
    }
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  try {
    const rows = await (prisma as any).model_categories.findMany({
      where: {
        scope,
        ...(group ? { category_group: group } : {}),
      },
      orderBy: { name: "asc" },
    });
    let items = rows.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      category_group: cat.category_group,
      scope: cat.scope,
    }));

    // If no items found and we have defaults, add them
    if (items.length === 0 && defaultOptions.length > 0) {
      items = defaultOptions.map((name) => ({
        id: `default-${name.toLowerCase()}`,
        name,
        category_group: group || "custom",
        scope,
      }));
    }

    return res.json({ items });
  } catch (error) {
    console.error("Error listing avatar categories:", error);
    return res.status(500).json({ error: "internal_server_error", message: "Failed to fetch categories" });
  }
}