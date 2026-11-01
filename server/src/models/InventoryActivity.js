const mongoose = require("mongoose");

const inventoryActivitySchema = new mongoose.Schema(
  {
    pantryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pantry",
      required: true,
      index: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PantryItem",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    changeAmount: {
      type: Number,
      default: 0,
    },
    action: {
      type: String,
      enum: [
        "ITEM_ADDED",
        "ITEM_EDITED",
        "ITEM_DELETED",
        "QUANTITY_INCREASED",
        "QUANTITY_DECREASED",
      ],
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { versionKey: false }
);

module.exports = mongoose.model("InventoryActivity", inventoryActivitySchema);
