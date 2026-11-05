const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON request body",
    });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body exceeds the 1 MB limit",
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map(
      (error) => error.message
    );

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: messages,
    });
  }

  // Invalid MongoDB ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid prompt ID",
    });
  }

  res.status(500).json({
    success: false,
    message: "Server error",
  });
};

module.exports = errorHandler;