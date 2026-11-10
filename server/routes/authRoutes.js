const express = require("express");
const rateLimit = require("express-rate-limit");
const validateRequest = require("../middleware/validateRequest");
const authenticate = require("../middleware/authenticate");
const csrfProtection = require("../middleware/csrfProtection");
const { requireTrustedOrigin } = require("../middleware/csrfProtection");
const controller = require("../controllers/authController");
const { registerSchema, loginSchema } = require("../validators/authValidator");

const router = express.Router();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => req.app.locals.config.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Try again later.",
  },
});
router.post(
  "/register",
  limiter,
  requireTrustedOrigin,
  validateRequest(registerSchema),
  controller.register,
);
router.post(
  "/login",
  limiter,
  requireTrustedOrigin,
  validateRequest(loginSchema),
  controller.login,
);
router.get("/me", authenticate, controller.me);
router.post("/logout", authenticate, csrfProtection, controller.logout);
module.exports = router;
