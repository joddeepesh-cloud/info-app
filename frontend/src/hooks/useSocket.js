import { io } from "socket.io-client";

const socket = io(window.API_BASE_URL + "");

export default socket;