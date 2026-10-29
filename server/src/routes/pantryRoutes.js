const express = require("express");
const {
  createPantry,
  getPantries,
} = require("../controllers/pantryController");
const tempAuth = require("../middleware/tempAuth");

const router = express.Router();

router.post("/", tempAuth, createPantry);
router.get("/", tempAuth, getPantries);

module.exports = router;