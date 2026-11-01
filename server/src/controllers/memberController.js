
const User = require("../models/User");
const Pantry = require("../models/Pantry");
const mongoose = require("mongoose");


// POST /api/pantries/:id/members
const addMember = async (req, res) => {
  try {
    const { email } = req.body;
    const pantry = req.pantry;

    // Validate email.
    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Member email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find an existing registered user.
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("_id name email");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No registered user found with this email",
      });
    }

    // Prevent adding the pantry owner again.
    if (user._id.toString() === pantry.ownerId.toString()) {
      return res.status(400).json({
        success: false,
        message: "The pantry owner is already a member",
      });
    }

    // Prevent duplicate membership.
    const alreadyMember = pantry.memberIds.some(
      (memberId) => memberId.toString() === user._id.toString()
    );

    if (alreadyMember) {
      return res.status(409).json({
        success: false,
        message: "This user is already a pantry member",
      });
    }

    // Atomically add the user without creating duplicate IDs.
    const updatedPantry = await Pantry.findByIdAndUpdate(
      pantry._id,
      {
        $addToSet: { memberIds: user._id },
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!updatedPantry) {
      return res.status(404).json({
        success: false,
        message: "Pantry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Member added successfully",
      member: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Add pantry member error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add pantry member",
    });
  }
};




// GET /api/pantries/:id/members
const getPantryMembers = async (req, res) => {
  try {
    // req.pantry is set by requirePantryMember middleware.
    const pantry = req.pantry;

    // Fetch only the public details needed by the frontend.
    const users = await User.find({
      _id: { $in: pantry.memberIds },
    }).select("name email");

    // Preserve the member order stored in the pantry.
    const usersById = new Map(
      users.map((user) => [user._id.toString(), user])
    );

    const members = pantry.memberIds
      .map((memberId) => {
        const user = usersById.get(memberId.toString());

        if (!user) return null;

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          role:
            user._id.toString() === pantry.ownerId.toString()
              ? "Owner"
              : "Member",
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      count: members.length,
      members,
    });
  } catch (error) {
    console.error("Get pantry members error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve pantry members",
    });
  }
};




const removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const pantry = req.pantry;

    // Validate member ID.
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID",
      });
    }

    // Prevent removing the pantry owner.
    if (memberId === pantry.ownerId.toString()) {
      return res.status(400).json({
        success: false,
        message: "The pantry owner cannot be removed",
      });
    }

    // Check whether the user belongs to this pantry.
    const isMember = pantry.memberIds.some(
      (id) => id.toString() === memberId
    );

    if (!isMember) {
      return res.status(404).json({
        success: false,
        message: "User is not a member of this pantry",
      });
    }

    // Remove only this user's membership from this pantry.
    const updatedPantry = await Pantry.findByIdAndUpdate(
      pantry._id,
      {
        $pull: { memberIds: new mongoose.Types.ObjectId(memberId) },
      },
      { returnDocument: "after" }
    );

    if (!updatedPantry) {
      return res.status(404).json({
        success: false,
        message: "Pantry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Member removed successfully",
      removedMemberId: memberId,
    });
  } catch (error) {
    console.error("Remove pantry member error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove pantry member",
    });
  }
};




module.exports = {
  addMember,
  getPantryMembers,
  removeMember,
};