const webhookController = require("./webhookController");
const zoomController = require("./zoomController");

// ✅ Main Webhook Handler (Determines event source)
exports.webhookHandler = async (req, res) => {
  try {
    console.log("📢 Headers:", req.headers);
    console.log("📢 Full Payload:", JSON.stringify(req.body, null, 2));

    if (!req.body || Object.keys(req.body).length === 0) {
      console.error("❌ ERROR: Empty Webhook Payload");
      return res.status(400).json({ error: "Empty Webhook Payload" });
    }

    const eventSource = req.headers["user-agent"] || ""; // Identify source
    console.log(`📢 Webhook Source: ${eventSource}`);

    if (eventSource.includes("Zoom") || req.body.event.includes("meeting")) {
      console.log("🔹 Routing to Zoom Webhook...");
      return zoomController.zoomWebhook(req, res);
    } else {
      console.log("🔹 Routing to Calendly Webhook...");
      return calendlyController.calendlyWebhook(req, res);
    }
  } catch (error) {
    console.error("❌ Error handling webhook:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
