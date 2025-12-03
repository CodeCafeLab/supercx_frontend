import { Router } from "express";
import { loginAdmin, loginUser, signupUser } from "../controllers/authController";

const router = Router();

router.post("/login/admin", loginAdmin);
router.post("/login/user", loginUser);
router.post("/signup/user", signupUser);
router.get("/login/admin", (_req, res) => res.status(405).json({ error: "method_not_allowed" }));
router.get("/login/user", (_req, res) => res.status(405).json({ error: "method_not_allowed" }));
router.get("/signup/user", (_req, res) => res.status(405).json({ error: "method_not_allowed" }));

export default router;