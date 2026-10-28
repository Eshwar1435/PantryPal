
require("dotenv").config({ path: "../.env" });

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`PantryPal API running on port ${PORT}`);
  });
};

startServer();
