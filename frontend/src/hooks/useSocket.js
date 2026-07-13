import { io } from "socket.io-client";

const API_URL =
  import.meta.env.VITE_API_URL ||
  window.API_BASE_URL ||
  "https://info-app-backend-7r0e.onrender.com";

const socket = io(API_URL, {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

export default socket;