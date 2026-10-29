
const mongoose = require("mongoose");

// TEMPORARY LOCAL DEVELOPMENT ONLY.
// Replace with Member 1's real authentication middleware.
const tempAuth = (req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(500).json({
      success: false,
      message: "Temporary authentication is disabled in production",
    });
  }

  const userId = req.header("x-dev-user-id");

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(401).json({
      success: false,
      message: "Provide a valid x-dev-user-id header",
    });
  }

  req.user = { _id: userId };
  next();
};

module.exports = tempAuth;
