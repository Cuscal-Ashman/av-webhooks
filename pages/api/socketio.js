// pages/api/socketio.js
import { Server } from "socket.io";

export default function handler(req, res) {
  // Check if Socket.IO server is already initialized
  if (!res.socket.server.io) {
    console.log("Initializing Socket.IO server...");

    // Initialize the Socket.IO server on the underlying HTTP server
    const io = new Server(res.socket.server, {
      path: "/api/socketio",
      // Uncomment and configure CORS if needed:
      // cors: { origin: "*" },
    });

    // Attach the instance to the socket server so it can be reused elsewhere
    res.socket.server.io = io;
  }
  res.end();
}
