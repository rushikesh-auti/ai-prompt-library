const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const promptRoutes = require("./routes/promptRoutes");
const authRoutes = require("./routes/authRoutes");
const exploreRoutes = require("./routes/exploreRoutes");
const collectionRoutes = require("./routes/collectionRoutes");
const errorHandler = require("./middleware/errorHandler");
const createApp = (config) => {
  const app = express();
  app.locals.config = {
    JWT_SECRET: config.JWT_SECRET || "test-only-secret-that-is-at-least-thirty-two-characters",
    JWT_EXPIRES_IN: config.JWT_EXPIRES_IN || "7d",
    COOKIE_MAX_AGE_MS: config.COOKIE_MAX_AGE_MS || 604800000,
    COOKIE_SAME_SITE: config.COOKIE_SAME_SITE || "lax",
    cookieSecure: config.cookieSecure ?? false,
    ...config,
  };
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin))
          return callback(null, true);
        return callback(new Error("Origin is not allowed by CORS"));
      },
      credentials: true,
    }),
  );
  app.use(
    rateLimit({
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      max: config.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.get("/", (req, res) =>
    res.json({ success: true, message: "AI Prompt Library API is running" }),
  );
  app.get("/health", (req, res) => res.json({ success: true, status: "ok" }));
  app.get("/ready", (req, res) => {
    const ready = mongoose.connection.readyState === 1;
    return res
      .status(ready ? 200 : 503)
      .json({ success: ready, status: ready ? "ready" : "not_ready" });
  });
  app.use("/api/auth", authRoutes);
  app.use("/api/prompts", promptRoutes);
  app.use("/api/explore", exploreRoutes);
  app.use("/api/collections", collectionRoutes);
  app.use((req, res) =>
    res.status(404).json({ success: false, message: "Route not found" }),
  );
  app.use(errorHandler);
  return app;
};
module.exports = createApp;
