const authService = require("../services/authService");

const cookieOptions = (config, httpOnly) => ({
  httpOnly,
  secure: config.cookieSecure,
  sameSite: config.COOKIE_SAME_SITE,
  path: "/",
  maxAge: config.COOKIE_MAX_AGE_MS,
});
const clearOptions = (config, httpOnly) => ({
  httpOnly,
  secure: config.cookieSecure,
  sameSite: config.COOKIE_SAME_SITE,
  path: "/",
});
const establishSession = (res, user, config, status) => {
  const { token, csrfToken } = authService.createSession(user, config);
  res.cookie("auth_token", token, cookieOptions(config, true));
  res.cookie("csrf_token", csrfToken, cookieOptions(config, false));
  return res
    .status(status)
    .json({
      success: true,
      data: { user: authService.publicUser(user), csrfToken },
    });
};
const register = async (req, res) =>
  establishSession(
    res,
    await authService.register(req.validatedBody),
    req.app.locals.config,
    201,
  );
const login = async (req, res) =>
  establishSession(
    res,
    await authService.login(req.validatedBody),
    req.app.locals.config,
    200,
  );
const logout = (req, res) => {
  const config = req.app.locals.config;
  res.clearCookie("auth_token", clearOptions(config, true));
  res.clearCookie("csrf_token", clearOptions(config, false));
  res.status(200).json({ success: true, message: "Logged out successfully" });
};
const me = (req, res) =>
  res
    .status(200)
    .json({
      success: true,
      data: {
        user: authService.publicUser(req.user),
        csrfToken: req.auth.csrf,
      },
    });
module.exports = { register, login, logout, me };
