import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: "admin" | "user";
}

/**
 * Optional authentication middleware
 * Verifies JWT token if present, but doesn't require it
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; role: "admin" | "user" };
    req.userId = decoded.sub;
    req.userRole = decoded.role;
  } catch (err) {
    // Invalid token, but continue without auth
    console.warn("Invalid token:", err);
  }
  
  next();
}

/**
 * Required authentication middleware
 * Requires valid JWT token
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "unauthorized", message: "Missing or invalid authorization header" });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; role: "admin" | "user" };
    req.userId = decoded.sub;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ error: "unauthorized", message: "Invalid or expired token" });
  }
}

/**
 * Require admin role middleware
 * Must be used after requireAuth
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "forbidden", message: "Admin access required" });
  }
  next();
}

