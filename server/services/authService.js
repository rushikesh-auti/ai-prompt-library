const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../errors/ApiError");

const publicUser = (user) => ({ id: user._id.toString(), name: user.name, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt });
const createSession = (user, config) => {
  const csrfToken = crypto.randomBytes(32).toString("hex");
  const token = jwt.sign({ sub: user._id.toString(), csrf: csrfToken }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
  return { token, csrfToken };
};
const register = async (data) => {
  const existing = await User.exists({ email: data.email });
  if (existing) throw new ApiError(409, "An account with this email already exists");
  return User.create(data);
};
const login = async (data) => {
  const user = await User.findOne({ email: data.email }).select("+password");
  if (!user || !(await user.comparePassword(data.password))) throw new ApiError(401, "Invalid email or password");
  if (!user.isActive) throw new ApiError(403, "This account is inactive");
  return user;
};
module.exports = { publicUser, createSession, register, login };
