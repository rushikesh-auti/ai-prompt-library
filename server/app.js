const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const promptRoutes = require("./routes/promptRoutes");
const errorHandler = require("./middleware/errorHandler");
const createApp = (config) => {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin))
          return callback(null, true);
        return callback(new Error("Origin is not allowed by CORS"));
      },
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
  app.use("/api/prompts", promptRoutes);
  app.use((req, res) =>
    res.status(404).json({ success: false, message: "Route not found" }),
  );
  app.use(errorHandler);
  return app;
};
module.exports = createApp;
