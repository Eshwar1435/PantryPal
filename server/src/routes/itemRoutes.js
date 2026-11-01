const express = require("express");

const authenticate = require("../middleware/auth");
const {
  requirePantryMember,
  requirePantryOwner,
} = require("../middleware/pantryAccess");
const {
  getItems,
  getGlobalItems,
  addItem,
  updateItem,
  deleteItem,
  changeQuantity,
  loadItemAccess,
  requireItemOwner,
} = require("../controllers/itemController");

const router = express.Router();

router.get(
  "/inventory",
  authenticate,
  getGlobalItems
);

router.get(
  "/pantries/:id/items",
  authenticate,
  requirePantryMember,
  getItems
);

router.post(
  "/pantries/:id/items",
  authenticate,
  requirePantryMember,
  requirePantryOwner,
  addItem
);

router.patch(
  "/items/:id",
  authenticate,
  loadItemAccess,
  requireItemOwner,
  updateItem
);

router.delete(
  "/items/:id",
  authenticate,
  loadItemAccess,
  requireItemOwner,
  deleteItem
);

router.patch(
  "/items/:id/quantity",
  authenticate,
  loadItemAccess,
  changeQuantity
);

module.exports = router;
