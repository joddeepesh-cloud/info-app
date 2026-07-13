const { Server } = require("socket.io");
const { handleSocketConnection } = require("../controllers/socketController");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    handleSocketConnection(io, socket);
  });
}

function getIO() {
  return io;
}

module.exports = {
  initSocket,
  getIO,
};