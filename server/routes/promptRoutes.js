const express = require("express");

const {
  getPrompts,
  getSummary,
  getTrash,
  getPrompt,
  getPromptVersions,
  getPromptVersion,
  restorePromptVersion,
  getPromptTestCases,
  createPromptTestCase,
  updatePromptTestCase,
  deletePromptTestCase,
  runPromptTestCase,
  getPromptEvaluations,
  updatePromptEvaluationCriteria,
  createPromptEvaluation,
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
  testCaseSchema,
  evaluationSchema,
  evaluationCriteriaUpdateSchema,
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
router.get("/:id/versions", getPromptVersions);
router.get("/:id/versions/:versionId", getPromptVersion);
router.post("/:id/restore/:versionId", csrfProtection, restorePromptVersion);
router.get("/:id/test-cases", getPromptTestCases);
router.post("/:id/test-cases", csrfProtection, validateRequest(testCaseSchema), createPromptTestCase);
router.put("/:id/test-cases/:testCaseId", csrfProtection, validateRequest(testCaseSchema), updatePromptTestCase);
router.delete("/:id/test-cases/:testCaseId", csrfProtection, deletePromptTestCase);
router.post("/:id/test-cases/:testCaseId/run", csrfProtection, runPromptTestCase);
router.get("/:id/evaluations", getPromptEvaluations);
router.put("/:id/evaluation-criteria", csrfProtection, validateRequest(evaluationCriteriaUpdateSchema), updatePromptEvaluationCriteria);
router.post("/:id/evaluations", csrfProtection, validateRequest(evaluationSchema), createPromptEvaluation);
router.post("/:id/restore", csrfProtection, restorePrompt);
router.delete("/:id/permanent", csrfProtection, permanentlyDeletePrompt);

router
  .route("/:id")
  .get(getPrompt)
  .put(csrfProtection, validateRequest(updatePromptSchema), updatePrompt)
  .delete(csrfProtection, deletePrompt);

module.exports = router;
