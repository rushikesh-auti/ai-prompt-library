const express = require("express");

const {
  getPrompts,
  getSummary,
  getPrompt,
  createPrompt,
  importPrompts,
  updatePrompt,
  deletePrompt,
} = require("../controllers/promptController");
const validateRequest = require("../middleware/validateRequest");
const authenticate = require("../middleware/authenticate");
const csrfProtection = require("../middleware/csrfProtection");
const {
  createPromptSchema,
  updatePromptSchema,
  importPromptsSchema,
} = require("../validators/promptValidator");

const router = express.Router();
router.use(authenticate);
router.get("/summary", getSummary);

router
  .route("/")
  .get(getPrompts)
  .post(csrfProtection, validateRequest(createPromptSchema), createPrompt);

router.post("/import", csrfProtection, validateRequest(importPromptsSchema), importPrompts);

router
  .route("/:id")
  .get(getPrompt)
  .put(csrfProtection, validateRequest(updatePromptSchema), updatePrompt)
  .delete(csrfProtection, deletePrompt);

module.exports = router;
