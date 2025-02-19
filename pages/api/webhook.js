export default function handler(req, res) {
  if (req.method === "POST") {
    try {
      console.log("📩 Received webhook data:", req.body);

      // Store webhook data (Resets on server restart)
      global.lastWebhookData = {
        timestamp: new Date().toISOString(),
        data: req.body,
      };

      return res.status(200).json({
        success: true,
        message: "Webhook received and stored",
        data: global.lastWebhookData,
      });
    } catch (error) {
      console.error("❌ Error processing webhook:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error.message || "Unknown error",
      });
    }
  } else if (req.method === "GET") {
    return res.status(200).json(global.lastWebhookData || { message: "No webhook data received yet" });
  }

  res.setHeader("Allow", ["POST", "GET"]);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
