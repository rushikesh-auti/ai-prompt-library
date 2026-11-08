const express = require("express");

const {
  getPrompts,
  getPrompt,
  createPrompt,
  importPrompts,
  updatePrompt,
  deletePrompt,
} = require("../controllers/promptController");
const validateRequest = require("../middleware/validateRequest");
const {
  createPromptSchema,
  updatePromptSchema,
  importPromptsSchema,
} = require("../validators/promptValidator");

const router = express.Router();

router
  .route("/")
  .get(getPrompts)
  .post(validateRequest(createPromptSchema), createPrompt);

router.post("/import", validateRequest(importPromptsSchema), importPrompts);

router
  .route("/:id")
  .get(getPrompt)
  .put(validateRequest(updatePromptSchema), updatePrompt)
  .delete(deletePrompt);

module.exports = router;
