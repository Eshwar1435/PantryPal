const mongoose = require("mongoose");

const pantryItemSchema = new mongoose.Schema(
  {
    pantryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pantry",
      required: [true, "Pantry is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Item category is required"],
      trim: true,
      maxlength: [60, "Item category must be 60 characters or fewer"],
    },
    quantity: {
      type: Number,
      required: [true, "Item quantity is required"],
      min: [0, "Item quantity cannot be negative"],
    },
    unit: {
      type: String,
      required: [true, "Item unit is required"],
      trim: true,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    lowStockThreshold: {
      type: Number,
      required: [true, "Low-stock threshold is required"],
      min: [0, "Low-stock threshold cannot be negative"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PantryItem", pantryItemSchema);
