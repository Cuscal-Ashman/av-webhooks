// pages/api/webhook.js
export const config = {
    api: {
      bodyParser: true, // Adjust if you need custom parsing/verification
    },
  };
  
  export default function webhookHandler(req, res) {
    if (req.method === "POST") {
      // Process/verify the webhook payload as needed.
      const webhookEvent = req.body;
      console.log("Received webhook:", webhookEvent);
  
      // Broadcast to all connected clients
      if (res.socket.server.io) {
        res.socket.server.io.emit("webhookEvent", webhookEvent);
      } else {
        console.error("Socket.IO server not initialized.");
      }
  
      res.status(200).json({ received: true });
    } else {
      res.status(405).end();
    }
  }
  