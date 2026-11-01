const express = require("express");

const authenticate = require("../middleware/auth");
const { requirePantryMember } = require("../middleware/pantryAccess");
const { getPantryActivity } = require("../controllers/activityController");

const router = express.Router();

router.get(
  "/pantries/:id/activity",
  authenticate,
  requirePantryMember,
  getPantryActivity
);

module.exports = router;
