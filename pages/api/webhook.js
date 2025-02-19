// pages/api/webhook.js
import { Server } from "socket.io";

export const config = {
  api: {
    bodyParser: true,
  },
};

export default function webhookHandler(req, res) {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.IO server...");
    const io = new Server(res.socket.server);
    res.socket.server.io = io;
  }

  if (req.method === "POST") {
    const webhookEvent = req.body;
    console.log("Received webhook event:", webhookEvent);

    // Emit the event to the frontend
    res.socket.server.io.emit("webhookEvent", webhookEvent);

    return res.status(200).json({ received: true, data: webhookEvent });
  }

  return res.status(405).end();
}
