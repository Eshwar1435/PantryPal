
const express = require("express");

const {
  createPantry,
  getPantries,
  deletePantry,
} = require("../controllers/pantryController");

const { addMember , getPantryMembers,removeMember, } = require("../controllers/memberController");

const authenticate = require("../middleware/auth");

const {
  requirePantryMember,
  requirePantryOwner,
} = require("../middleware/pantryAccess");

const router = express.Router();

// Create a pantry.
router.post("/", authenticate, createPantry);

// Get pantries belonging to the logged-in user.
router.get("/", authenticate, getPantries);

router.delete(
  "/:id",
  authenticate,
  requirePantryMember,
  requirePantryOwner,
  deletePantry
);

// Add a registered user to a pantry (owner only).
router.post(
  "/:id/members",
  authenticate,
  requirePantryMember,
  requirePantryOwner,
  addMember
);

// Get pantry members (owner and members).
router.get(
  "/:id/members",
  authenticate,
  requirePantryMember,
  getPantryMembers
);


// Remove a pantry member (owner only).
router.delete(
  "/:id/members/:memberId",
  authenticate,
  requirePantryMember,
  requirePantryOwner,
  removeMember
);




module.exports = router;
