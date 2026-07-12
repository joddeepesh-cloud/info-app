const { Server } = require("socket.io");
const User = require("../models/User");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("typing", (data) => {
  socket.broadcast.emit("user-typing", data);
});

socket.on("stop-typing", () => {
  socket.broadcast.emit("user-stop-typing");
});
    console.log("🟢 User Connected:", socket.id);

    // User comes online
    socket.on("user-online", async (userId) => {
      try {
        await User.findByIdAndUpdate(userId, {
          status: "Online",
          lastSeen: new Date(),
        });

        io.emit("status-updated");
      } catch (err) {
        console.log(err);
      }
    });

    // Chat messages
    socket.on("send-message", (message) => {
      io.emit("receive-message", message);
    });

    // User disconnects
    socket.on("disconnect", async () => {
      console.log("🔴 User Disconnected:", socket.id);
    });
  });
}

module.exports = {
  initSocket,
};