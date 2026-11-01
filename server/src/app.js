
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const pantryRoutes = require("./routes/pantryRoutes");
const itemRoutes = require("./routes/itemRoutes");
const authRoutes = require("./routes/authRoutes");
const activityRoutes = require("./routes/activityRoutes");

const app = express();

const configuredOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([
  ...configuredOrigins,
  ...configuredOrigins
    .filter((origin) => origin === "http://localhost:5173")
    .map(() => "http://127.0.0.1:5173"),
])];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Cookie-authenticated writes must come from an explicitly allowed browser origin.
// SameSite cookies provide an additional browser-level CSRF defense.
app.use((req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const origin = req.get("origin");
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ success: false, message: "Request origin is not allowed" });
  }
  return next();
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "PantryPal API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", itemRoutes);
app.use("/api", activityRoutes);
app.use("/api/pantries", pantryRoutes);

module.exports = app;
