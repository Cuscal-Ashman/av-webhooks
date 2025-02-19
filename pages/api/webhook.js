import { Server } from "socket.io";

export const config = {
  api: {
    bodyParser: true,
  },
};

export default function webhookHandler(req, res) {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.IO server...");
    const io = new Server(res.socket.server, {
      path: "/api/webhook", // Explicitly setting path
      addTrailingSlash: false, // Prevents unnecessary slashes in paths
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    
    res.socket.server.io = io;
  }

  if (req.method === "POST") {
    const webhookEvent = req.body;
    console.log("Received webhook event:", webhookEvent);

    // Emit the event to all connected clients
    res.socket.server.io.emit("webhookEvent", webhookEvent);

    return res.status(200).json({ received: true, data: webhookEvent });
  }

  return res.status(405).end();
}
