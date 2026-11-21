const express = require("express");

const {
  getPrompts,
  getSummary,
  getTrash,
  getPrompt,
  createPrompt,
  importPrompts,
  updatePrompt,
  deletePrompt,
  restorePrompt,
  permanentlyDeletePrompt,
  reorderPrompts,
  bulkPrompts,
} = require("../controllers/promptController");
const validateRequest = require("../middleware/validateRequest");
const authenticate = require("../middleware/authenticate");
const csrfProtection = require("../middleware/csrfProtection");
const {
  createPromptSchema,
  updatePromptSchema,
  importPromptsSchema,
  reorderPromptsSchema,
  bulkPromptsSchema,
} = require("../validators/promptValidator");

const router = express.Router();
router.use(authenticate);
router.get("/summary", getSummary);
router.get("/trash", getTrash);
router.post("/reorder", csrfProtection, validateRequest(reorderPromptsSchema), reorderPrompts);
router.post("/bulk", csrfProtection, validateRequest(bulkPromptsSchema), bulkPrompts);

router
  .route("/")
  .get(getPrompts)
  .post(csrfProtection, validateRequest(createPromptSchema), createPrompt);

router.post("/import", csrfProtection, validateRequest(importPromptsSchema), importPrompts);
router.post("/:id/restore", csrfProtection, restorePrompt);
router.delete("/:id/permanent", csrfProtection, permanentlyDeletePrompt);

router
  .route("/:id")
  .get(getPrompt)
  .put(csrfProtection, validateRequest(updatePromptSchema), updatePrompt)
  .delete(csrfProtection, deletePrompt);

module.exports = router;
