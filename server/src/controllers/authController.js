const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const Pantry = require("../models/Pantry");
const PantryItem = require("../models/PantryItem");
const InventoryActivity = require("../models/InventoryActivity");
const { emitPantryEvent, revokePantryAccess, disconnectUser } = require("../realtime");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COOKIE_NAME = "pantrypal_token";

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const cookieDays = Number(process.env.JWT_COOKIE_EXPIRES_IN_DAYS || 7);

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: Math.max(1, cookieDays) * 24 * 60 * 60 * 1000,
  };
};

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

const createToken = (user) => jwt.sign(
  { sub: user._id.toString() },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
);

const sendAuthenticatedUser = (res, status, message, user) => {
  const token = createToken(user);
  res.cookie(COOKIE_NAME, token, getCookieOptions());
  return res.status(status).json({ success: true, message, user: publicUser(user) });
};

const register = async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!name || !EMAIL_PATTERN.test(email) || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Provide a name, a valid email address, and a password of at least 8 characters.",
      });
    }

    const existingUser = await User.exists({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "An account with that email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    return sendAuthenticatedUser(res, 201, "Registration successful", user);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: "An account with that email already exists." });
    }
    console.error("Registration error:", error);
    return res.status(500).json({ success: false, message: "Unable to register at this time." });
  }
};

const login = async (req, res) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!EMAIL_PATTERN.test(email) || !password) {
      return res.status(400).json({ success: false, message: "Provide a valid email address and password." });
    }

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    return sendAuthenticatedUser(res, 200, "Login successful", user);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Unable to log in at this time." });
  }
};

const getCurrentUser = (req, res) => res.status(200).json({
  success: true,
  user: publicUser(req.user),
});

const logout = (req, res) => {
  const { maxAge, ...clearOptions } = getCookieOptions();
  res.clearCookie(COOKIE_NAME, clearOptions);
  return res.status(200).json({ success: true, message: "Logout successful" });
};

const publicNotificationPreferences = user => ({
  lowStock: user.notificationPreferences?.lowStock ?? true,
  expiry: user.notificationPreferences?.expiry ?? true,
  memberActivity: user.notificationPreferences?.memberActivity ?? true,
});

const getPreferences = (req, res) => res.status(200).json({
  success: true,
  preferences: publicNotificationPreferences(req.user),
});

const updatePreferences = async (req, res) => {
  try {
    const allowedKeys = ["lowStock", "expiry", "memberActivity"];
    const updates = {};
    for (const key of allowedKeys) {
      if (req.body?.[key] !== undefined) {
        if (typeof req.body[key] !== "boolean") {
          return res.status(400).json({
            success: false,
            message: `${key} preference must be a boolean.`,
          });
        }
        updates[`notificationPreferences.${key}`] = req.body[key];
      }
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({
        success: false,
        message: "At least one notification preference is required.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    );

    return res.status(200).json({
      success: true,
      preferences: publicNotificationPreferences(user),
    });
  } catch (error) {
    console.error("Update notification preferences error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update notification preferences.",
    });
  }
};

const supportsTransactions = async () => {
  const hello = await User.db.db.admin().command({ hello: 1 });
  return Boolean(hello.setName || hello.msg === "isdbgrid");
};

const getOwnedPantriesForDeletion = async (userId, session) => Pantry.find({
  ownerId: userId,
}).session(session || null);

const validateOwnershipTransfers = (pantries, ownershipTransfers, departingUserId) => {
  if (!Array.isArray(ownershipTransfers)) {
    return "Ownership transfers must be an array.";
  }

  const transferByPantryId = new Map();
  for (const transfer of ownershipTransfers) {
    if (!transfer || typeof transfer !== "object") {
      return "Each ownership transfer must include a pantry ID and new owner ID.";
    }

    const { pantryId, newOwnerId } = transfer;
    if (!mongoose.Types.ObjectId.isValid(pantryId) || !mongoose.Types.ObjectId.isValid(newOwnerId)) {
      return "Ownership transfers contain an invalid pantry or user ID.";
    }
    if (transferByPantryId.has(String(pantryId))) {
      return "Each owned pantry may have only one ownership transfer.";
    }
    transferByPantryId.set(String(pantryId), String(newOwnerId));
  }

  for (const pantry of pantries) {
    const otherMembers = pantry.memberIds.filter(
      memberId => memberId.toString() !== pantry.ownerId.toString()
    );
    const newOwnerId = transferByPantryId.get(pantry._id.toString());

    if (otherMembers.length && !newOwnerId) {
      return `Choose a new owner for "${pantry.name}".`;
    }
    if (!otherMembers.length && newOwnerId) {
      return `The private pantry "${pantry.name}" does not require an ownership transfer.`;
    }
    if (newOwnerId && !pantry.memberIds.some(memberId => memberId.toString() === newOwnerId)) {
      return `The new owner for "${pantry.name}" must already be a pantry member.`;
    }
    if (newOwnerId && newOwnerId === departingUserId.toString()) {
      return `The new owner for "${pantry.name}" must be another pantry member.`;
    }
  }

  const ownedIds = new Set(pantries.map(pantry => pantry._id.toString()));
  if ([...transferByPantryId.keys()].some(pantryId => !ownedIds.has(pantryId))) {
    return "Ownership transfers may only target pantries owned by your account.";
  }

  return null;
};

const deleteAccount = async (req, res) => {
  try {
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const confirmation = typeof req.body?.confirmation === "string" ? req.body.confirmation : "";
    const ownershipTransfers = req.body?.ownershipTransfers;

    if (!password) {
      return res.status(400).json({ success: false, message: "Your password is required." });
    }
    if (confirmation !== "DELETE") {
      return res.status(400).json({ success: false, message: 'Type "DELETE" to confirm account deletion.' });
    }

    const user = await User.findById(req.user._id).select("+passwordHash");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Incorrect password." });
    }

    const ownedPantries = await getOwnedPantriesForDeletion(user._id);
    const validationError = validateOwnershipTransfers(
      ownedPantries,
      ownershipTransfers,
      user._id
    );
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    if (!(await supportsTransactions())) {
      return res.status(503).json({
        success: false,
        message: "Account deletion requires a MongoDB deployment with transaction support.",
      });
    }

    const realtimeEvents = [];
    const session = await User.startSession();
    try {
      await session.withTransaction(async () => {
        const currentPantries = await getOwnedPantriesForDeletion(user._id, session);
        const currentValidationError = validateOwnershipTransfers(
          currentPantries,
          ownershipTransfers,
          user._id
        );
        if (currentValidationError) {
          const error = new Error(currentValidationError);
          error.statusCode = 400;
          throw error;
        }

        const transferByPantryId = new Map(
          ownershipTransfers.map(transfer => [
            String(transfer.pantryId),
            String(transfer.newOwnerId),
          ])
        );

        for (const pantry of currentPantries) {
          const otherMembers = pantry.memberIds.filter(
            memberId => memberId.toString() !== user._id.toString()
          );
          if (otherMembers.length) {
            const newOwnerId = transferByPantryId.get(pantry._id.toString());
            const result = await Pantry.updateOne(
              { _id: pantry._id, ownerId: user._id },
              {
                $set: { ownerId: newOwnerId },
                $pull: { memberIds: user._id },
              },
              { session }
            );
            if (result.modifiedCount !== 1) {
              throw new Error("Ownership transfer did not complete.");
            }
            realtimeEvents.push(
              ["pantry:ownership-transferred", pantry._id, { newOwnerId }],
              ["pantry:member-removed", pantry._id, { memberId: user._id.toString() }]
            );
          } else {
            await PantryItem.deleteMany({ pantryId: pantry._id }, { session });
            await InventoryActivity.deleteMany({ pantryId: pantry._id }, { session });
            const result = await Pantry.deleteOne(
              { _id: pantry._id, ownerId: user._id },
              { session }
            );
            if (result.deletedCount !== 1) {
              throw new Error("Private pantry deletion did not complete.");
            }
          }
        }

        const survivingMemberships = await Pantry.find({
          memberIds: user._id,
          ownerId: { $ne: user._id },
        }).select("_id");
        await Pantry.updateMany(
          { memberIds: user._id, ownerId: { $ne: user._id } },
          { $pull: { memberIds: user._id } },
          { session }
        );
        await PantryItem.updateMany(
          { createdBy: user._id },
          { $set: { createdBy: null } },
          { session }
        );
        await InventoryActivity.updateMany(
          { userId: user._id },
          { $set: { userId: null } },
          { session }
        );

        const deletedUser = await User.deleteOne({ _id: user._id }, { session });
        if (deletedUser.deletedCount !== 1) {
          throw new Error("Account deletion did not complete.");
        }
        for (const pantry of survivingMemberships) {
          realtimeEvents.push([
            "pantry:member-removed",
            pantry._id,
            { memberId: user._id.toString() },
          ]);
        }
      });
    } catch (error) {
      if (error.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      throw error;
    } finally {
      await session.endSession();
    }

    const { maxAge, ...clearOptions } = getCookieOptions();
    for (const [event, pantryId, payload] of realtimeEvents) {
      emitPantryEvent(req, event, pantryId, payload);
      if (event === "pantry:member-removed") {
        revokePantryAccess(req, pantryId, user._id);
      }
    }
    res.clearCookie(COOKIE_NAME, clearOptions);
    disconnectUser(req, user._id);
    return res.status(200).json({
      success: true,
      message: "Your account was deleted successfully.",
    });
  } catch (error) {
    console.error("Delete account error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to delete your account safely. No changes were applied.",
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  logout,
  getPreferences,
  updatePreferences,
  deleteAccount,
  COOKIE_NAME,
};
