const InventoryActivity = require("../models/InventoryActivity");

const getPantryActivity = async (req, res) => {
  try {
    const activities = await InventoryActivity.find({
      pantryId: req.pantry._id,
    })
      .sort({ createdAt: -1 })
      .populate("userId", "name email")
      .populate("itemId", "name");

    return res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error("Get pantry activity error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve pantry activity",
    });
  }
};

module.exports = { getPantryActivity };
