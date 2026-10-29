
const mongoose = require("mongoose");

const pantrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Pantry name is required"],
      trim: true,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Pantry owner is required"],
    },

    memberIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate members and ensure the owner belongs to the pantry.
pantrySchema.pre("validate", function () {
  if (this.ownerId) {
    const uniqueIds = new Set(
      this.memberIds.map((id) => id.toString())
    );

    uniqueIds.add(this.ownerId.toString());

    this.memberIds = [...uniqueIds];
  }
});

module.exports = mongoose.model("Pantry", pantrySchema);
