import { Router } from "express";
import {
  listBackgrounds,
  listProps,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createBackground,
  createProp,
  deleteBackground,
  deleteProp,
  listScenes,
  createScene,
  updateScene,
  deleteScene,
} from "../controllers/libraryController";

const router = Router();

router.get("/backgrounds", listBackgrounds);
router.get("/props", listProps);
router.get("/categories", listCategories);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);
router.post("/backgrounds", createBackground);
router.post("/props", createProp);
router.delete("/backgrounds/:id", deleteBackground);
router.delete("/props/:id", deleteProp);
router.get("/scenes", listScenes);
router.post("/scenes", createScene);
router.put("/scenes/:id", updateScene);
router.delete("/scenes/:id", deleteScene);

export default router;