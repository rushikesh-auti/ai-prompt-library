const express = require("express");

const {
  getPrompts,
  getPrompt,
  createPrompt,
  updatePrompt,
  deletePrompt,
} = require("../controllers/promptController");

const router = express.Router();

router.route("/").get(getPrompts).post(createPrompt);

router
  .route("/:id")
  .get(getPrompt)
  .put(updatePrompt)
  .delete(deletePrompt);

module.exports = router;