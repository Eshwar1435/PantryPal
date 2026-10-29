
const Pantry = require("../models/Pantry");

// POST /api/pantries
const createPantry = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate pantry name
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Pantry name is required",
      });
    }

    // The authentication middleware must set req.user.
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const pantry = await Pantry.create({
      name: name.trim(),
      ownerId: req.user._id,
      memberIds: [req.user._id],
    });

    return res.status(201).json({
      success: true,
      message: "Pantry created successfully",
      pantry,
    });
  } catch (error) {
    console.error("Create pantry error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create pantry",
    });
  }
};



const getPantries = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const pantries = await Pantry.find({
      memberIds: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: pantries.length,
      pantries,
    });
  } catch (error) {
    console.error("Get pantries error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve pantries",
    });
  }
};



module.exports = { createPantry, getPantries };
