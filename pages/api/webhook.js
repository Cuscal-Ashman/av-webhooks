// pages/api/webhook.js

export const config = {
  api: {
    bodyParser: true, // Enable parsing of request body
  },
};

export default function webhookHandler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end(); // Method Not Allowed
  }

  const webhookEvent = req.body;
  console.log("Received webhook event:", webhookEvent);

  // Emit event only if the Socket.IO server is initialized
  if (res.socket.server.io) {
    res.socket.server.io.emit("webhookEvent", webhookEvent);
  } else {
    console.error("Socket.IO not initialized yet.");
  }

  return res.status(200).json({ received: true, data: webhookEvent });
}
