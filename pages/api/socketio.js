// pages/api/socketio.js
import { Server } from "socket.io";

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.IO server...");

    const io = new Server(res.socket.server, {
      path: "/api/socketio",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // Handle WebSocket connections
    io.on("connection", (socket) => {
      console.log("New client connected:", socket.id);

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
}
