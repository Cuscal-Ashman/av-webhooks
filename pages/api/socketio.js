import { NextResponse } from "next/server";
import { headers } from "next/headers";

// Store webhook data in memory (note: resets on server restart)
let lastWebhookData = null;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  const headersList = headers();
  const contentType = headersList.get("content-type");

  console.log("Received POST request with content type:", contentType);

  if (contentType !== "application/json") {
    return NextResponse.json({ error: "Invalid content type" }, { status: 415 });
  }

  try {
    const webhookData = await request.json();
    console.log("Received webhook data:", JSON.stringify(webhookData));

    lastWebhookData = {
      timestamp: new Date().toISOString(),
      data: webhookData,
    };

    return NextResponse.json({
      success: true,
      message: "Webhook received and stored",
      data: lastWebhookData,
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(lastWebhookData || { message: "No webhook data received yet" });
}