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
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters")
    .optional(),
  JWT_EXPIRES_IN: z.string().default("7d"),
  COOKIE_MAX_AGE_MS: z.coerce.number().int().positive().default(604800000),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  COOKIE_SECURE: z.enum(["true", "false"]).optional(),
});

const loadEnvironment = (source = process.env) => {
  const result = environmentSchema.safeParse(source);
  if (!result.success)
    throw new Error(
      `Invalid environment configuration: ${result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`,
    );
  const { CORS_ORIGINS, COOKIE_SECURE, ...values } = result.data;
  if (!values.JWT_SECRET)
    throw new Error(
      "Invalid environment configuration: JWT_SECRET is required and must be at least 32 characters",
    );
  const cookieSecure =
    COOKIE_SECURE === undefined
      ? values.NODE_ENV === "production"
      : COOKIE_SECURE === "true";
  if (values.COOKIE_SAME_SITE === "none" && !cookieSecure)
    throw new Error(
      "Invalid environment configuration: COOKIE_SAME_SITE=none requires COOKIE_SECURE=true",
    );
  const corsOrigins = CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (!corsOrigins.length)
    throw new Error(
      "Invalid environment configuration: CORS_ORIGINS must contain an origin",
    );
  return { ...values, cookieSecure, corsOrigins };
};

module.exports = { loadEnvironment };
