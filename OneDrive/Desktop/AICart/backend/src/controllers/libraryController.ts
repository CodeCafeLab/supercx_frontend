import { Request, Response } from "express";
import { prisma, dbAvailable } from "../lib/prisma";
import { getSetting, isFeatureEnabled } from "../lib/settings";

// Dev fallback data (will be replaced by database)
const devBackgrounds: any[] = [];
const devProps: any[] = [];
const devCategories: Record<string, Set<string>> = {
  backgrounds: new Set(["All"]),
  props: new Set(["All"]),
};

export async function listBackgrounds(req: Request, res: Response) {
  // Check if library backgrounds feature is enabled
  const enabled = await isFeatureEnabled("library.backgrounds");
  if (!enabled) {
    return res.status(403).json({ error: "feature_disabled", message: "Backgrounds library is currently disabled" });
  }

  // Always require database
  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  try {
    const category = (req.query.category as string) || "All";
    const search = (req.query.search as string)?.trim();
    const limitParam = parseInt((req.query.limit as string) || "60", 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 60;

    const where: any = {};
    if (category && category !== "All") {
      where.category = category;
    }
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const items = await (prisma as any).backgrounds_library.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { created_at: "desc" },
      take: limit,
    });
    return res.json({ items });
  } catch (error) {
    console.error("Error listing backgrounds:", error);
    return res.status(500).json({ error: "internal_server_error", message: "Failed to fetch backgrounds" });
  }
}

export async function listProps(req: Request, res: Response) {
  // Check if library props feature is enabled
  const enabled = await isFeatureEnabled("library.props");
  if (!enabled) {
    return res.status(403).json({ error: "feature_disabled", message: "Props library is currently disabled" });
  }

  // Always require database
  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  try {
    const category = (req.query.category as string) || "All";
    const search = (req.query.search as string)?.trim();
    const limitParam = parseInt((req.query.limit as string) || "100", 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 100;

    const where: any = {};
    if (category && category !== "All") {
      where.category = category;
    }
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const items = await (prisma as any).props_library.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { created_at: "desc" },
      take: limit,
    });
    return res.json({ items });
  } catch (error) {
    console.error("Error listing props:", error);
    return res.status(500).json({ error: "internal_server_error", message: "Failed to fetch props" });
  }
}

export async function listCategories(req: Request, res: Response) {
  const type = ((req.query.type as string) || "backgrounds").toLowerCase();
  const includeDefaults = req.query.includeDefaults !== "false";

  // Get default categories from settings
  let settingKey = "";
  switch (type) {
    case "props":
      settingKey = "library.props.default_categories";
      break;
    case "scenes":
      settingKey = "scenes.default_categories";
      break;
    default:
      settingKey = "library.backgrounds.default_categories";
  }

  const defaultCategories = includeDefaults ? (await getSetting(settingKey)) || [] : [];

  // Always require database unless we can satisfy via defaults
  if (!dbAvailable) {
    if (defaultCategories.length > 0) {
      return res.json({
        items: defaultCategories.map((name: string) => ({
          id: null,
          type,
          name,
          bg_color: undefined,
          accent_color: undefined,
          source: "default",
        })),
      });
    }
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  try {
    const rows = await (prisma as any).library_categories.findMany({
      where: { type },
      orderBy: { created_at: "asc" },
    });

    let items = rows.map((r: any) => ({
      id: r.id,
      type: r.type,
      name: r.name,
      bg_color: r.bg_color,
      accent_color: r.accent_color,
      source: "database",
    }));

    if (includeDefaults) {
      defaultCategories.forEach((name: string) => {
        if (!items.find((item) => item.name === name)) {
          items.push({
            id: null,
            type,
            name,
            bg_color: undefined,
            accent_color: undefined,
            source: "default",
          });
        }
      });
    }

    return res.json({ items });
  } catch (error) {
    console.error("Error listing categories:", error);
    return res.status(500).json({ error: "internal_server_error", message: "Failed to fetch categories" });
  }
}

export async function createCategory(req: Request, res: Response) {
  const { type, name, bg_color, accent_color } = req.body || {};
  if (!type || !name) {
    return res.status(400).json({ error: "invalid_input", message: "Type and name are required" });
  }

  // Always require database
  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  try {
    const t = (type as string).toLowerCase();
    const row = await (prisma as any).library_categories.create({ 
      data: { type: t, name, bg_color, accent_color } 
    });
    return res.status(201).json({ item: row });
  } catch (error: any) {
    console.error("Error creating category:", error);
    // Handle unique constraint violation
    if (error.code === "P2002") {
      return res.status(409).json({ error: "duplicate", message: "Category already exists" });
    }
    return res.status(500).json({ error: "internal_server_error", message: "Failed to create category" });
  }
}

export async function updateCategory(req: Request, res: Response) {
  const { id } = req.params;
  const { name, bg_color, accent_color } = req.body || {};
  if (!id) {
    return res.status(400).json({ error: "invalid_input", message: "Category ID is required" });
  }

  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  try {
    const row = await (prisma as any).library_categories.update({
      where: { id },
      data: { name, bg_color, accent_color },
    });
    return res.json({ item: row });
  } catch (error: any) {
    console.error("Error updating category:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "not_found", message: "Category not found" });
    }
    if (error.code === "P2002") {
      return res.status(409).json({ error: "duplicate", message: "Category already exists" });
    }
    return res.status(500).json({ error: "internal_server_error", message: "Failed to update category" });
  }
}

export async function deleteCategory(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "invalid_input", message: "Category ID is required" });
  }

  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  try {
    await (prisma as any).library_categories.delete({ where: { id } });
    return res.json({ ok: true });
  } catch (error: any) {
    console.error("Error deleting category:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "not_found", message: "Category not found" });
    }
    return res.status(500).json({ error: "internal_server_error", message: "Failed to delete category" });
  }
}

export async function createBackground(req: Request, res: Response) {
  const { name, category, image_url } = req.body || {};
  if (!name || !category) {
    return res.status(400).json({ error: "invalid_input", message: "Name and category are required" });
  }

  // Always require database
  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  try {
    // Create background in database
    const item = await (prisma as any).backgrounds_library.create({ 
      data: { name, category, image_url } 
    });
    
    // Ensure category exists (create if it doesn't)
    try {
      const existing = await (prisma as any).library_categories.findFirst({
        where: { type: "backgrounds", name: category },
      });
      if (!existing) {
        await (prisma as any).library_categories.create({ 
          data: { type: "backgrounds", name: category } 
        });
      }
    } catch {} // Ignore errors if category already exists
    
    return res.status(201).json({ item });
  } catch (error) {
    console.error("Error creating background:", error);
    return res.status(500).json({ error: "internal_server_error", message: "Failed to create background" });
  }
}

export async function createProp(req: Request, res: Response) {
  const { name, category, image_url } = req.body || {};
  if (!name || !category) {
    return res.status(400).json({ error: "invalid_input", message: "Name and category are required" });
  }

  // Always require database
  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  try {
    // Create prop in database
    const item = await (prisma as any).props_library.create({ 
      data: { name, category, image_url } 
    });
    
    // Ensure category exists (create if it doesn't)
    try {
      const existing = await (prisma as any).library_categories.findFirst({
        where: { type: "props", name: category },
      });
      if (!existing) {
        await (prisma as any).library_categories.create({ 
          data: { type: "props", name: category } 
        });
      }
    } catch {} // Ignore errors if category already exists
    
    return res.status(201).json({ item });
  } catch (error) {
    console.error("Error creating prop:", error);
    return res.status(500).json({ error: "internal_server_error", message: "Failed to create prop" });
  }
}

export async function deleteBackground(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "invalid_input", message: "Background ID is required" });
  }

  // Always require database
  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  try {
    // Check if background exists
    const background = await (prisma as any).backgrounds_library.findUnique({
      where: { id },
    });

    if (!background) {
      return res.status(404).json({ error: "not_found", message: "Background not found" });
    }

    await (prisma as any).backgrounds_library.delete({ where: { id } });
    return res.json({ ok: true, message: "Background deleted successfully" });
  } catch (error) {
    console.error("Error deleting background:", error);
    return res.status(500).json({ error: "internal_server_error", message: "Failed to delete background" });
  }
}

export async function deleteProp(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "invalid_input", message: "Prop ID is required" });
  }

  // Always require database
  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  try {
    // Check if prop exists
    const prop = await (prisma as any).props_library.findUnique({
      where: { id },
    });

    if (!prop) {
      return res.status(404).json({ error: "not_found", message: "Prop not found" });
    }

    await (prisma as any).props_library.delete({ where: { id } });
    return res.json({ ok: true, message: "Prop deleted successfully" });
  } catch (error) {
    console.error("Error deleting prop:", error);
    return res.status(500).json({ error: "internal_server_error", message: "Failed to delete prop" });
  }
}

export async function listScenes(req: Request, res: Response) {
  const category = (req.query.category as string) || "All";
  const search = (req.query.search as string) || "";
  const limitParam = parseInt((req.query.limit as string) || "60", 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 60;

  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  try {
    const where: any = {};
    if (category && category !== "All") {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const items = await (prisma as any).scene_library.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: limit,
    });

    return res.json({ items });
  } catch (error) {
    console.error("Error listing scenes:", error);
    return res.status(500).json({ error: "internal_server_error", message: "Failed to fetch scenes" });
  }
}

export async function createScene(req: Request, res: Response) {
  const { name, category, mood, description, image_url, metadata, tags, is_generated } = req.body || {};
  if (!name || !category) {
    return res.status(400).json({ error: "invalid_input", message: "Name and category are required" });
  }

  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  try {
    const payload = {
      name,
      category,
      mood,
      description,
      image_url,
      metadata,
      tags,
      is_generated: Boolean(is_generated),
    };
    const item = await (prisma as any).scene_library.create({ data: payload });

    // Ensure category exists for management views
    try {
      const existing = await (prisma as any).library_categories.findFirst({
        where: { type: "scenes", name: category },
      });
      if (!existing) {
        await (prisma as any).library_categories.create({
          data: { type: "scenes", name: category },
        });
      }
    } catch {}

    return res.status(201).json({ item });
  } catch (error) {
    console.error("Error creating scene:", error);
    return res.status(500).json({ error: "internal_server_error", message: "Failed to create scene" });
  }
}

export async function updateScene(req: Request, res: Response) {
  const { id } = req.params;
  const { name, category, mood, description, image_url, metadata, tags } = req.body || {};
  if (!id) {
    return res.status(400).json({ error: "invalid_input", message: "Scene ID is required" });
  }

  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  try {
    const item = await (prisma as any).scene_library.update({
      where: { id },
      data: { name, category, mood, description, image_url, metadata, tags },
    });

    if (category) {
      try {
        const existing = await (prisma as any).library_categories.findFirst({
          where: { type: "scenes", name: category },
        });
        if (!existing) {
          await (prisma as any).library_categories.create({
            data: { type: "scenes", name: category },
          });
        }
      } catch {}
    }

    return res.json({ item });
  } catch (error: any) {
    console.error("Error updating scene:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "not_found", message: "Scene not found" });
    }
    return res.status(500).json({ error: "internal_server_error", message: "Failed to update scene" });
  }
}

export async function deleteScene(req: Request, res: Response) {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "invalid_input", message: "Scene ID is required" });
  }

  if (!dbAvailable) {
    return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
  }

  try {
    await (prisma as any).scene_library.delete({ where: { id } });
    return res.json({ ok: true });
  } catch (error: any) {
    console.error("Error deleting scene:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "not_found", message: "Scene not found" });
    }
    return res.status(500).json({ error: "internal_server_error", message: "Failed to delete scene" });
  }
}