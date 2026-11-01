
const mongoose = require("mongoose");
const Pantry = require("../models/Pantry");

// Verify that the logged-in user belongs to the requested pantry.
const requirePantryMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate pantry ID format.
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pantry ID",
      });
    }

    // Find the pantry.
    const pantry = await Pantry.findById(id);

    if (!pantry) {
      return res.status(404).json({
        success: false,
        message: "Pantry not found",
      });
    }

    // Verify membership.
    const isMember = pantry.memberIds.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this pantry",
      });
    }

    // Make the verified pantry available to the next middleware/controller.
    req.pantry = pantry;

    return next();
  } catch (error) {
    console.error("Pantry member authorization error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify pantry access",
    });
  }
};

// Verify that the logged-in user owns the requested pantry.
// This middleware expects requirePantryMember to run first.
const requirePantryOwner = (req, res, next) => {
  if (!req.pantry || !req.user) {
    return res.status(500).json({
      success: false,
      message: "Pantry authorization middleware is missing",
    });
  }

  const isOwner =
    req.pantry.ownerId.toString() === req.user._id.toString();

  if (!isOwner) {
    return res.status(403).json({
      success: false,
      message: "Only the pantry owner can perform this action",
    });
  }

  return next();
};

module.exports = {
  requirePantryMember,
  requirePantryOwner,
};
