const ApiError = require("../errors/ApiError");

const requireTrustedOrigin = (req, _res, next) => {
  const origin = req.get("origin");
  const config = req.app.locals.config;
  if (!origin || !config.corsOrigins.includes(origin))
    return next(new ApiError(403, "Untrusted request origin"));
  return next();
};
const csrfProtection = (req, _res, next) => {
  const originError = requireTrustedOrigin(req, _res, (error) => error);
  if (originError instanceof ApiError) return next(originError);
  const token = req.get("x-csrf-token");
  if (!token || token !== req.auth?.csrf || token !== req.cookies?.csrf_token)
    return next(new ApiError(403, "Invalid CSRF token"));
  return next();
};
module.exports = csrfProtection;
module.exports.requireTrustedOrigin = requireTrustedOrigin;
