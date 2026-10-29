
const express = require("express");
const cors = require("cors");

const pantryRoutes = require("./routes/pantryRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "PantryPal API is running",
  });
});

app.use("/api/pantries", pantryRoutes);

module.exports = app;
