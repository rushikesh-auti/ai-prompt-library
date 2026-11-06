const { z } = require("zod");

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  MONGO_URI: z
    .string()
    .min(1, "MONGO_URI is required")
    .regex(
      /^mongodb(\+srv)?:\/\//,
      "MONGO_URI must be a MongoDB connection URI",
    ),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
});

const loadEnvironment = (source = process.env) => {
  const result = environmentSchema.safeParse(source);
  if (!result.success)
    throw new Error(
      `Invalid environment configuration: ${result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`,
    );
  const { CORS_ORIGINS, ...values } = result.data;
  const corsOrigins = CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (!corsOrigins.length)
    throw new Error(
      "Invalid environment configuration: CORS_ORIGINS must contain an origin",
    );
  return { ...values, corsOrigins };
};

module.exports = { loadEnvironment };
