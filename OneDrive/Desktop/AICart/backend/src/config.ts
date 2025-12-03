import dotenv from "dotenv";
dotenv.config();

export const PORT = parseInt(process.env.PORT || "4000", 10);
export const JWT_SECRET = process.env.JWT_SECRET || "secret";

// Get client origins from environment or use defaults
const defaultOrigins = "http://localhost:9002,http://127.0.0.1:9002";
const clientOrigin = process.env.CLIENT_ORIGIN || defaultOrigins;

// Parse and clean origins
export const ALLOWED_ORIGINS = clientOrigin
  .split(",")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

// In production, also allow requests from the same origin (for Next.js rewrites)
if (process.env.NODE_ENV === "production") {
  // Add any production origins from environment
  const prodOrigins = process.env.PRODUCTION_ORIGINS;
  if (prodOrigins) {
    const parsed = prodOrigins.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
    parsed.forEach((origin) => {
      if (!ALLOWED_ORIGINS.includes(origin)) {
        ALLOWED_ORIGINS.push(origin);
      }
    });
  }
}

console.log("Allowed CORS origins:", ALLOWED_ORIGINS);
