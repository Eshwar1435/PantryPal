const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COOKIE_NAME = "pantrypal_token";

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const cookieDays = Number(process.env.JWT_COOKIE_EXPIRES_IN_DAYS || 7);

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: Math.max(1, cookieDays) * 24 * 60 * 60 * 1000,
  };
};

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

const createToken = (user) => jwt.sign(
  { sub: user._id.toString() },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
);

const sendAuthenticatedUser = (res, status, message, user) => {
  const token = createToken(user);
  res.cookie(COOKIE_NAME, token, getCookieOptions());
  return res.status(status).json({ success: true, message, user: publicUser(user) });
};

const register = async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!name || !EMAIL_PATTERN.test(email) || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Provide a name, a valid email address, and a password of at least 8 characters.",
      });
    }

    const existingUser = await User.exists({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "An account with that email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    return sendAuthenticatedUser(res, 201, "Registration successful", user);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: "An account with that email already exists." });
    }
    console.error("Registration error:", error);
    return res.status(500).json({ success: false, message: "Unable to register at this time." });
  }
};

const login = async (req, res) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!EMAIL_PATTERN.test(email) || !password) {
      return res.status(400).json({ success: false, message: "Provide a valid email address and password." });
    }

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    return sendAuthenticatedUser(res, 200, "Login successful", user);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Unable to log in at this time." });
  }
};

const getCurrentUser = (req, res) => res.status(200).json({
  success: true,
  user: publicUser(req.user),
});

const logout = (req, res) => {
  const { maxAge, ...clearOptions } = getCookieOptions();
  res.clearCookie(COOKIE_NAME, clearOptions);
  return res.status(200).json({ success: true, message: "Logout successful" });
};

module.exports = { register, login, getCurrentUser, logout, COOKIE_NAME };
