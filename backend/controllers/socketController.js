const User = require("../models/User");
const Group = require("../models/Group");
const socketService = require("../services/socketService");

const handleSocketConnection = (io, socket) => {
  console.log("🟢 User Connected:", socket.id);

  // ===========================
  // USER ONLINE
  // ===========================
  socket.on("user-online", async (userId) => {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const username = user.username;
      socketService.registerSocket(username, socket.id);

      await User.findByIdAndUpdate(userId, {
        status: "Online",
        lastSeen: new Date(),
      });

      const groups = await Group.find({ members: username });
      groups.forEach((group) => {
        socket.join(group._id.toString());
      });

      io.emit("status-updated", {
        username,
        status: "Online",
      });

      io.emit("user-status-change", {
        username,
        status: "Online",
      });

      console.log(`👤 ${username} is online`);
    } catch (err) {
      console.error(err);
    }
  });

  // ===========================
  // JOIN GROUP
  // ===========================
  socket.on("join-group", ({ groupId }) => {
    if (!groupId) return;
    socket.join(groupId.toString());
    console.log(`Joined Group ${groupId}`);
  });

  // ===========================
  // LEAVE GROUP
  // ===========================
  socket.on("leave-group", ({ groupId }) => {
    if (!groupId) return;
    socket.leave(groupId.toString());
    console.log(`Left Group ${groupId}`);
  });

  // ===========================
  // GROUP MESSAGE
  // ===========================
  socket.on("group-message", (message) => {
    try {
      const { groupId } = message;
      if (groupId) {
        io.to(groupId.toString()).emit("group-message", message);
        io.to(groupId.toString()).emit("receive-message", message); // compatibility
      }
    } catch (err) {
      console.error("Error broadcasting group message:", err);
    }
  });

  // ===========================
  // PRIVATE MESSAGE
  // ===========================
  socket.on("private-message", (message) => {
    try {
      const { sender, receiver } = message;
      const receiverSockets = socketService.getSocketsByUsername(receiver);
      receiverSockets.forEach((id) => {
        io.to(id).emit("private-message", message);
        io.to(id).emit("receive-message", message); // compatibility
      });

      const senderSockets = socketService.getSocketsByUsername(sender);
      senderSockets.forEach((id) => {
        if (id !== socket.id) {
          io.to(id).emit("private-message", message);
          io.to(id).emit("receive-message", message); // compatibility
        }
      });
    } catch (err) {
      console.error("Error sending private message:", err);
    }
  });

  // ===========================
  // COMPATIBILITY MESSAGE EMIT
  // ===========================
  socket.on("send-message", (message) => {
    try {
      const { sender, receiver, groupId } = message;
      if (groupId) {
        io.to(groupId.toString()).emit("receive-message", message);
        io.to(groupId.toString()).emit("group-message", message);
        return;
      }

      const receiverSockets = socketService.getSocketsByUsername(receiver);
      receiverSockets.forEach((id) => {
        io.to(id).emit("receive-message", message);
        io.to(id).emit("private-message", message);
      });

      const senderSockets = socketService.getSocketsByUsername(sender);
      senderSockets.forEach((id) => {
        if (id !== socket.id) {
          io.to(id).emit("receive-message", message);
          io.to(id).emit("private-message", message);
        }
      });
    } catch (err) {
      console.error(err);
    }
  });

  // ===========================
  // TYPING
  // ===========================
  socket.on("typing", (data) => {
    try {
      const { receiver, groupId } = data;
      if (groupId) {
        socket.to(groupId).emit("user-typing", data);
        return;
      }
      socketService.getSocketsByUsername(receiver).forEach((id) => {
        io.to(id).emit("user-typing", data);
      });
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("stop-typing", (data) => {
    try {
      const { receiver, groupId } = data;
      if (groupId) {
        socket.to(groupId).emit("user-stop-typing", data);
        return;
      }
      socketService.getSocketsByUsername(receiver).forEach((id) => {
        io.to(id).emit("user-stop-typing", data);
      });
    } catch (err) {
      console.error(err);
    }
  });

  // ===========================
  // MESSAGE READ
  // ===========================
  socket.on("message-read", (data) => {
    socketService.getSocketsByUsername(data.sender).forEach((id) => {
      io.to(id).emit("message-read", data);
    });
  });

  // ===========================
  // MESSAGE DELIVERED
  // ===========================
  socket.on("message-delivered", (data) => {
    socketService.getSocketsByUsername(data.sender).forEach((id) => {
      io.to(id).emit("message-delivered", data);
    });
  });

  // ===========================
  // MESSAGE DELETED
  // ===========================
  socket.on("message-deleted", (data) => {
    const { receiver, sender, groupId } = data;
    if (groupId) {
      io.to(groupId).emit("message-deleted", data);
      return;
    }
    socketService.getSocketsByUsername(receiver).forEach((id) => {
      io.to(id).emit("message-deleted", data);
    });
    socketService.getSocketsByUsername(sender).forEach((id) => {
      if (id !== socket.id) {
        io.to(id).emit("message-deleted", data);
      }
    });
  });

  // ===========================
  // MESSAGE EDIT
  // ===========================
  socket.on("message-edited", (data) => {
    const { receiver, sender, groupId } = data;
    if (groupId) {
      io.to(groupId).emit("message-edited", data);
      return;
    }
    socketService.getSocketsByUsername(receiver).forEach((id) => {
      io.to(id).emit("message-edited", data);
    });
    socketService.getSocketsByUsername(sender).forEach((id) => {
      if (id !== socket.id) {
        io.to(id).emit("message-edited", data);
      }
    });
  });

  // ===========================
  // GROUP PIN UPDATE
  // ===========================
  socket.on("group-pin-change", (data) => {
    if (!data.groupId) return;
    io.to(data.groupId).emit("group-pin-updated", data);
  });

  // ===========================
  // REACTIONS
  // ===========================
  socket.on("send-reaction", (data) => {
    const { receiver, groupId } = data;
    if (groupId) {
      io.to(groupId).emit("message-reacted", data);
      return;
    }
    socketService.getSocketsByUsername(receiver).forEach((id) => {
      io.to(id).emit("message-reacted", data);
    });
  });

  // ===========================
  // DISCONNECT
  // ===========================
  socket.on("disconnect", async () => {
    try {
      const username = socketService.unregisterSocket(socket.id);
      if (!username) return;

      const user = await User.findOne({ username });
      if (!user) return;

      await User.findByIdAndUpdate(user._id, {
        status: "Offline",
        lastSeen: new Date(),
      });

      io.emit("status-updated", {
        username,
        status: "Offline",
      });

      io.emit("user-status-change", {
        username,
        status: "Offline",
      });

      console.log(`${username} disconnected`);
    } catch (err) {
      console.error(err);
    }
  });
};

module.exports = {
  handleSocketConnection,
};