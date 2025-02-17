// pages/api/webhook.js
export const config = {
    api: {
      bodyParser: true,
    },
  };
  
  export default function webhookHandler(req, res) {
    if (req.method === "POST") {
      const webhookEvent = req.body;
      console.log("Received webhook event on server:", webhookEvent);
  
      // Check if the Socket.IO server is available and emit the event
      if (res.socket.server.io) {
        console.log("Emitting event to connected clients");
        res.socket.server.io.emit("webhookEvent", webhookEvent);
      } else {
        console.error("Socket.IO server not initialized.");
      }
  
      res.status(200).json({ received: true });
    } else {
      res.status(405).end();
    }
  }
  