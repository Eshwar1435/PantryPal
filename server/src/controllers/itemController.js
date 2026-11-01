const mongoose = require("mongoose");
const Pantry = require("../models/Pantry");
const PantryItem = require("../models/PantryItem");
const InventoryActivity = require("../models/InventoryActivity");

const recordActivity = (req, itemId, action, changeAmount, note) =>
  InventoryActivity.create({
    pantryId: req.pantry._id,
    itemId,
    userId: req.user._id,
    action,
    changeAmount,
    note,
  });

const itemFields = [
  "name",
  "category",
  "quantity",
  "unit",
  "expiryDate",
  "lowStockThreshold",
];

const isValidDate = value => {
  if (typeof value !== "string" || !value.trim()) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

const validateItemFields = (payload, { partial = false } = {}) => {
  const errors = [];

  if (!partial || payload.name !== undefined) {
    if (typeof payload.name !== "string" || !payload.name.trim()) {
      errors.push("Item name is required");
    }
  }
  if (!partial || payload.category !== undefined) {
    if (typeof payload.category !== "string" || !payload.category.trim()) {
      errors.push("Item category is required");
    } else if (payload.category.trim().length > 60) {
      errors.push("Item category must be 60 characters or fewer");
    }
  }
  if (!partial || payload.unit !== undefined) {
    if (typeof payload.unit !== "string" || !payload.unit.trim()) {
      errors.push("Item unit is required");
    }
  }
  if (payload.expiryDate !== undefined && payload.expiryDate !== null) {
    if (!isValidDate(payload.expiryDate)) {
      errors.push("Expiry date must be a valid date or empty");
    }
  }
  if (!partial || payload.quantity !== undefined) {
    if (
      typeof payload.quantity !== "number" ||
      !Number.isFinite(payload.quantity) ||
      payload.quantity < 0
    ) {
      errors.push("Quantity must be a non-negative number");
    }
  }
  if (!partial || payload.lowStockThreshold !== undefined) {
    if (
      typeof payload.lowStockThreshold !== "number" ||
      !Number.isFinite(payload.lowStockThreshold) ||
      payload.lowStockThreshold < 0
    ) {
      errors.push("Low-stock threshold must be a non-negative number");
    }
  }

  return errors;
};

const sendValidationError = (res, errors) =>
  res.status(400).json({ success: false, message: errors.join(". ") });

const loadItemAccess = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID",
      });
    }

    const item = await PantryItem.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    const pantry = await Pantry.findById(item.pantryId);
    if (!pantry) {
      return res.status(404).json({
        success: false,
        message: "Pantry not found",
      });
    }

    const isMember = pantry.memberIds.some(
      memberId => memberId.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this pantry",
      });
    }

    req.item = item;
    req.pantry = pantry;
    return next();
  } catch (error) {
    console.error("Inventory access authorization error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify inventory access",
    });
  }
};

const requireItemOwner = (req, res, next) => {
  if (req.pantry.ownerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "Only the pantry owner can perform this action",
    });
  }

  return next();
};

const getItems = async (req, res) => {
  try {
    const items = await PantryItem.find({ pantryId: req.pantry._id }).sort({
      createdAt: 1,
    });

    return res.status(200).json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    console.error("Get pantry inventory error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve pantry inventory",
    });
  }
};

const getGlobalItems = async (req, res) => {
  try {
    const pantries = await Pantry.find({ memberIds: req.user._id })
      .select("_id name ownerId")
      .lean();
    const pantryIds = pantries.map(pantry => pantry._id);
    const pantryById = new Map(
      pantries.map(pantry => [pantry._id.toString(), pantry])
    );
    const items = await PantryItem.find({ pantryId: { $in: pantryIds } })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: items.length,
      items: items.map(item => {
        const pantry = pantryById.get(item.pantryId.toString());
        return {
          ...item,
          pantryName: pantry.name,
          pantryOwnerId: pantry.ownerId,
        };
      }),
    });
  } catch (error) {
    console.error("Get global inventory error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve global inventory",
    });
  }
};

const addItem = async (req, res) => {
  try {
    const body = req.body || {};
    const errors = validateItemFields(body);
    if (errors.length) return sendValidationError(res, errors);

    const item = await PantryItem.create({
      pantryId: req.pantry._id,
      name: body.name.trim(),
      category: body.category.trim(),
      quantity: body.quantity,
      unit: body.unit.trim(),
      expiryDate: body.expiryDate || null,
      lowStockThreshold: body.lowStockThreshold,
      createdBy: req.user._id,
    });
    await recordActivity(
      req,
      item._id,
      "ITEM_ADDED",
      item.quantity,
      `Added ${item.name}`
    );

    return res.status(201).json({
      success: true,
      message: "Inventory item added successfully",
      item,
    });
  } catch (error) {
    console.error("Add pantry inventory item error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory item data",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to add inventory item",
    });
  }
};

const updateItem = async (req, res) => {
  try {
    const body = req.body || {};
    const updates = {};
    for (const field of itemFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({
        success: false,
        message: "At least one item field is required",
      });
    }

    const errors = validateItemFields(updates, { partial: true });
    if (errors.length) return sendValidationError(res, errors);

    if (updates.name !== undefined) updates.name = updates.name.trim();
    if (updates.category !== undefined) updates.category = updates.category.trim();
    if (updates.unit !== undefined) updates.unit = updates.unit.trim();
    if (updates.expiryDate === "") updates.expiryDate = null;

    const item = await PantryItem.findByIdAndUpdate(
      { _id: req.item._id, pantryId: req.pantry._id },
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }
    await recordActivity(
      req,
      item._id,
      "ITEM_EDITED",
      0,
      `Edited ${item.name}`
    );

    return res.status(200).json({
      success: true,
      message: "Inventory item updated successfully",
      item,
    });
  } catch (error) {
    console.error("Update pantry inventory item error:", error);
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory item data",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to update inventory item",
    });
  }
};

const deleteItem = async (req, res) => {
  try {
    const result = await PantryItem.deleteOne({
      _id: req.item._id,
      pantryId: req.pantry._id,
    });
    if (!result.deletedCount) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }
    await recordActivity(
      req,
      req.item._id,
      "ITEM_DELETED",
      0,
      `Deleted item: ${req.item.name}`
    );

    return res.status(200).json({
      success: true,
      message: "Inventory item deleted successfully",
      deletedItemId: req.item._id,
    });
  } catch (error) {
    console.error("Delete pantry inventory item error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete inventory item",
    });
  }
};

const changeQuantity = async (req, res) => {
  try {
    const { change } = req.body || {};
    if (
      typeof change !== "number" ||
      !Number.isFinite(change) ||
      change === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity change must be a non-zero number",
      });
    }

    const filter = { _id: req.item._id, pantryId: req.pantry._id };
    if (change < 0) filter.quantity = { $gte: Math.abs(change) };

    const item = await PantryItem.findOneAndUpdate(
      filter,
      { $inc: { quantity: change } },
      { returnDocument: "after", runValidators: true }
    );

    if (!item) {
      return res.status(409).json({
        success: false,
        message: "Quantity cannot be reduced below zero",
      });
    }
    const action = change > 0 ? "QUANTITY_INCREASED" : "QUANTITY_DECREASED";
    await recordActivity(
      req,
      item._id,
      action,
      change,
      `${change > 0 ? "Increased" : "Decreased"} ${req.item.name} quantity`
    );

    return res.status(200).json({
      success: true,
      message: "Inventory quantity updated successfully",
      item,
    });
  } catch (error) {
    console.error("Change pantry inventory quantity error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update inventory quantity",
    });
  }
};

module.exports = {
  getItems,
  getGlobalItems,
  addItem,
  updateItem,
  deleteItem,
  changeQuantity,
  loadItemAccess,
  requireItemOwner,
};
