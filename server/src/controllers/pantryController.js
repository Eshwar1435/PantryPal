
const Pantry = require("../models/Pantry");
const PantryItem = require("../models/PantryItem");
const InventoryActivity = require("../models/InventoryActivity");
const mongoose = require("mongoose");

const supportsTransactions = async () => {
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  return Boolean(hello.setName || hello.msg === "isdbgrid");
};

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

const deletePantry = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid pantry ID" });
  }

  const pantry = await Pantry.findById(id).lean();
  if (!pantry) {
    return res.status(404).json({ success: false, message: "Pantry not found" });
  }
  if (pantry.ownerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "Only the pantry owner can delete this pantry" });
  }

  let useTransaction;
  try {
    useTransaction = await supportsTransactions();
    if (useTransaction) {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          await PantryItem.deleteMany({ pantryId: pantry._id }, { session });
          await InventoryActivity.deleteMany({ pantryId: pantry._id }, { session });
          const deleted = await Pantry.deleteOne({ _id: pantry._id }, { session });
          if (!deleted.deletedCount) throw new Error("Pantry deletion did not complete");
        });
      } finally {
        await session.endSession();
      }
    } else {
      const items = await PantryItem.find({ pantryId: pantry._id }).lean();
      const activities = await InventoryActivity.find({ pantryId: pantry._id }).lean();
      let pantryDeleted = false;
      try {
        await PantryItem.deleteMany({ pantryId: pantry._id });
        await InventoryActivity.deleteMany({ pantryId: pantry._id });
        const deleted = await Pantry.deleteOne({ _id: pantry._id });
        if (!deleted.deletedCount) throw new Error("Pantry deletion did not complete");
        pantryDeleted = true;
      } catch (fallbackError) {
        try {
          if (pantryDeleted) await Pantry.create(pantry);
          if (items.length) await PantryItem.insertMany(items, { ordered: true });
          if (activities.length) await InventoryActivity.insertMany(activities, { ordered: true });
        } catch (rollbackError) {
          console.error("Delete pantry rollback error:", rollbackError);
          throw new Error("Pantry deletion failed and rollback could not be completed");
        }
        throw fallbackError;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Pantry and its inventory history were deleted successfully",
      deletedPantryId: id,
    });
  } catch (error) {
    console.error("Delete pantry error:", error.name, error.message);
    return res.status(500).json({ success: false, message: "Failed to delete pantry safely" });
  }
};

module.exports = { createPantry, getPantries, deletePantry };
