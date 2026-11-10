const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Email must be valid").transform((email) => email.toLowerCase()),
  password: z.string().min(12, "Password must be at least 12 characters").max(128),
}).strict();
const loginSchema = z.object({
  email: z.string().trim().email("Email must be valid").transform((email) => email.toLowerCase()),
  password: z.string().min(1, "Password is required").max(128),
}).strict();

module.exports = { registerSchema, loginSchema };
