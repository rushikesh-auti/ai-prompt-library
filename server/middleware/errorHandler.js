const ApiError = require("../errors/ApiError");
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (process.env.NODE_ENV !== "test" && !(err instanceof ApiError))
    console.error(err);
  if (err.type === "entity.parse.failed")
    return res
      .status(400)
      .json({ success: false, message: "Malformed JSON request body" });
  if (err.type === "entity.too.large")
    return res
      .status(413)
      .json({ success: false, message: "Request body exceeds the 1 MB limit" });
  if (err instanceof ApiError)
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details && { errors: err.details }),
    });
  if (err.name === "ValidationError")
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(err.errors).map((error) => error.message),
    });
  if (err && err.code === 11000) {
    const duplicateField = Object.keys(err.keyPattern || {})[0];
    const message =
      duplicateField === "name"
        ? "A collection with this name already exists"
        : duplicateField === "email"
          ? "An account with this email already exists"
          : "A record with these values already exists";
    return res.status(409).json({ success: false, message });
  }
  if (err.name === "CastError")
    return res
      .status(400)
      .json({ success: false, message: "Invalid prompt ID" });
  return res.status(500).json({ success: false, message: "Server error" });
};
module.exports = errorHandler;
