const { formatZodIssues } = require("../validators/promptValidator");
const validateRequest = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success)
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formatZodIssues(result.error.issues),
    });
  req.validatedBody = result.data;
  return next();
};
module.exports = validateRequest;
