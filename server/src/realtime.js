const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const User = require("./models/User");
const Pantry = require("./models/Pantry");

const pantryRoom = pantryId => `pantry:${pantryId}`;

const getCookie = (cookieHeader, name) => cookieHeader
  ?.split(";")
  .map(part => part.trim())
  .find(part => part.startsWith(`${name}=`))
  ?.slice(name.length + 1);

const createRealtime = (httpServer, allowedOrigins, cookieName) => {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = getCookie(socket.handshake.headers.cookie, cookieName);
      if (!token) return next(new Error("Authentication required"));

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload?.sub).select("_id");
      if (!user) return next(new Error("Authentication required"));

      socket.data.userId = user._id.toString();
      return next();
    } catch {
      return next(new Error("Authentication required"));
    }
  });

  io.on("connection", socket => {
    socket.on("pantry:join", async (pantryId, callback) => {
      try {
        const pantry = await Pantry.findOne({
          _id: pantryId,
          memberIds: socket.data.userId,
        }).select("_id");

        if (!pantry) {
          const error = { success: false, message: "You do not have access to this pantry" };
          socket.emit("pantry:join-rejected", { pantryId, ...error });
          if (typeof callback === "function") callback(error);
          return;
        }

        socket.join(pantryRoom(pantryId));
        if (typeof callback === "function") callback({ success: true, pantryId });
      } catch {
        const error = { success: false, message: "Unable to verify pantry access" };
        socket.emit("pantry:join-rejected", { pantryId, ...error });
        if (typeof callback === "function") callback(error);
      }
    });

    socket.on("pantry:leave", pantryId => {
      socket.leave(pantryRoom(pantryId));
    });
  });

  return io;
};

const emitPantryEvent = (req, event, pantryId, payload = {}) => {
  req.app.locals.io?.to(pantryRoom(pantryId)).emit(event, {
    pantryId: pantryId.toString(),
    ...payload,
  });
};

const revokePantryAccess = (req, pantryId, userId) => {
  const room = req.app.locals.io?.sockets?.adapter?.rooms?.get(pantryRoom(pantryId));
  if (!room) return;

  for (const socketId of room) {
    const socket = req.app.locals.io.sockets.sockets.get(socketId);
    if (socket?.data.userId === userId.toString()) {
      socket.leave(pantryRoom(pantryId));
      socket.emit("pantry:access-revoked", {
        pantryId: pantryId.toString(),
      });
    }
  }
};

const disconnectUser = (req, userId) => {
  const sockets = req.app.locals.io?.sockets?.sockets;
  if (!sockets) return;
  for (const socket of sockets.values()) {
    if (socket.data.userId === userId.toString()) socket.disconnect(true);
  }
};

const closePantryRoom = (req, pantryId) => {
  req.app.locals.io?.in(pantryRoom(pantryId)).socketsLeave(pantryRoom(pantryId));
};

module.exports = {
  createRealtime,
  emitPantryEvent,
  revokePantryAccess,
  disconnectUser,
  closePantryRoom,
};
