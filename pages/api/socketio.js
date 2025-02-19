// pages/api/socketio.js
import { Server } from "socket.io";

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log("🚀 Initializing Socket.IO server...");

    const io = new Server(res.socket.server, {
      path: "/api/socketio",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    res.socket.server.io = io;

    // Handle WebSocket connection events
    io.on("connection", (socket) => {
      console.log("✅ New client connected:", socket.id);

      socket.on("disconnect", () => {
        console.log("❌ Client disconnected:", socket.id);
      });
    });
  }

  const io = res.socket.server.io;

  if (req.method === "POST") {
    console.log("📩 Received Webhook:", req.body);

    // Emit webhook event to all connected clients
    io.emit("webhookEvent", req.body);

    // Check if eventTypeId is "transactions.updated" and disconnect all clients
    if (req.body.eventTypeId === "transactions.updated") {
      console.log("🔴 'transactions.updated' received, disconnecting all clients...");

      // Disconnect all connected clients
      io.sockets.sockets.forEach((socket) => {
        console.log(`🔌 Disconnecting socket: ${socket.id}`);
        socket.disconnect(true);
      });
    }

    return res.status(200).json({ success: true });
  }

  res.end();
}
