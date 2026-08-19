import { io, Socket } from "socket.io-client";

export const socket: Socket = io( import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
  autoConnect: false,
  transports: ["websocket"],
});