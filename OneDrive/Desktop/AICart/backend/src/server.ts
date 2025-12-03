import express from "express";
import cors from "cors";
import { ALLOWED_ORIGINS, PORT } from "./config";
import authRouter from "./routes/auth";
import avatarsRouter from "./routes/avatars";
import libraryRouter from "./routes/library";
import settingsRouter from "./routes/settings";
import productRouter from "./routes/product";
import lightingRouter from "./routes/lighting";
import webhookRouter from "./routes/webhook";
import { connectDB } from "./lib/prisma";

async function start() {
  await connectDB();
  const app = express();
  
  // CORS configuration with proper error handling
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps, Postman, or same-origin requests)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      
      // In development, be more permissive
      if (process.env.NODE_ENV !== "production") {
        console.warn(`CORS: Allowing origin ${origin} in development mode`);
        return callback(null, true);
      }
      
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  };
  
  app.use(cors(corsOptions));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  
  // Health check endpoint
  app.get("/health", (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));
  
  // API routes
  app.use("/api/auth", authRouter);
  app.use("/api/avatars", avatarsRouter);
  app.use("/api/library", libraryRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/product", productRouter);
  app.use("/api/lighting", lightingRouter);
  app.use("/api/webhook", webhookRouter);
  
  // Error handling middleware
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Error:", err);
    res.status(500).json({ error: "internal_server_error", message: err.message });
  });
  
  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: "not_found" });
  });
  
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log("Database connected");
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
