// Map of username -> Set of socket.id
const userSockets = new Map();

/**
 * Register a socket connection for a username.
 */
const registerSocket = (username, socketId) => {
  if (!userSockets.has(username)) {
    userSockets.set(username, new Set());
  }
  userSockets.get(username).add(socketId);
};

/**
 * Unregister a socket connection and return the username if they are fully offline.
 */
const unregisterSocket = (socketId) => {
  for (const [username, sockets] of userSockets.entries()) {
    if (sockets.has(socketId)) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        userSockets.delete(username);
        return username; // User is now fully offline
      }
      break;
    }
  }
  return null;
};

/**
 * Get all active socket IDs for a given username.
 */
const getSocketsByUsername = (username) => {
  const sockets = userSockets.get(username);
  return sockets ? Array.from(sockets) : [];
};

/**
 * Get all online usernames.
 */
const getOnlineUsers = () => {
  return Array.from(userSockets.keys());
};

/**
 * Check if a username is online.
 */
const isUserOnline = (username) => {
  return userSockets.has(username);
};

module.exports = {
  registerSocket,
  unregisterSocket,
  getSocketsByUsername,
  getOnlineUsers,
  isUserOnline
};
