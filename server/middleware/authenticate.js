const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../errors/ApiError");

const authenticate = async (req, _res, next) => {
  const token = req.cookies?.auth_token;
  if (!token) return next(new ApiError(401, "Authentication is required"));
  try {
    const payload = jwt.verify(token, req.app.locals.config.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return next(new ApiError(401, "Authentication is required"));
    if (!user.isActive)
      return next(new ApiError(403, "This account is inactive"));
    req.user = user;
    req.auth = payload;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError")
      return next(new ApiError(401, "Session has expired"));
    return next(new ApiError(401, "Invalid authentication session"));
  }
};
module.exports = authenticate;
