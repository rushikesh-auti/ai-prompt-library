const express = require("express");
const authenticate = require("../middleware/authenticate");
const { explorePrompts } = require("../controllers/promptController");

const router = express.Router();
router.get("/", authenticate, explorePrompts);
module.exports = router;
