const express = require("express");
const authenticate = require("../middleware/authenticate");
const csrfProtection = require("../middleware/csrfProtection");
const validateRequest = require("../middleware/validateRequest");
const {
  createCollectionSchema,
  updateCollectionSchema,
} = require("../validators/collectionValidator");
const controller = require("../controllers/collectionController");

const router = express.Router();
router.use(authenticate);
router.get("/", controller.getCollections);
router.post(
  "/",
  csrfProtection,
  validateRequest(createCollectionSchema),
  controller.createCollection,
);
router.put(
  "/:id",
  csrfProtection,
  validateRequest(updateCollectionSchema),
  controller.updateCollection,
);
router.delete("/:id", csrfProtection, controller.deleteCollection);

module.exports = router;
