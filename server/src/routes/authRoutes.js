const express = require("express");
const rateLimit = require("express-rate-limit");
const authenticate = require("../middleware/auth");
const {
  register,
  login,
  getCurrentUser,
  logout,
  getPreferences,
  updatePreferences,
  deleteAccount,
} = require("../controllers/authController");

const router = express.Router();
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts. Please try again later." },
});

router.post("/register", authRateLimit, register);
router.post("/login", authRateLimit, login);
router.get("/me", authenticate, getCurrentUser);
router.get("/preferences", authenticate, getPreferences);
router.patch("/preferences", authenticate, updatePreferences);
router.post("/logout", logout);
router.delete("/account", authenticate, deleteAccount);

module.exports = router;
