import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io(window.location.origin, { path: "/api/socketio" });

export function AccountVerificationFormStep3LoadingSteps() {
  const [progress, setProgress] = useState(0);
  const [localJobId, setLocalJobId] = useState(null);
  const [webhookData, setWebhookData] = useState(null);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Socket connected with id:", socket.id);
    });

    socket.on("webhookEvent", (data) => {
      console.log("Received webhook event:", data);
      setWebhookData(data);

      if (data.eventTypeId === "transactions.updated" && localJobId) {
        setProgress(100);
        socket.disconnect();
      }
    });

    return () => {
      console.log("Disconnecting socket");
      socket.disconnect();
    };
  }, [localJobId]);

  return (
    <div>
      <h2>Progress: {progress}%</h2>
      {progress === 100 && <button>Continue</button>}
    </div>
  );
}
