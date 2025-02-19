import { useEffect, useState } from "react";
import io from "socket.io-client";
import { Button } from "@/components/Button";
import { CircularProgressBar } from "@/components/CircularProgressBar";
import { useAccountVerificationForm } from "@/components/AccountVerificationForm/AccountVerificationFormProvider";
import { AccountVerificationFormResumeInBackgroundModal } from "@/components/AccountVerificationForm/AccountVerificationFormResumeInBackgroundModal";

export function AccountVerificationFormStep3LoadingSteps() {
  const [webhookData, setWebhookData] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [isAlertVisible, setIsAlertVisible] = useState(false);

  const { basiqConnection, goForward } = useAccountVerificationForm();
  const { error, completed } = basiqConnection;

  // Listen for WebSocket Events
  useEffect(() => {
    if (typeof window === "undefined") return;

    const socket = io(window.location.origin);

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    // Listen for webhook event and show an alert
    socket.on("webhookEvent", (data) => {
      console.log("Received webhook event:", data);
      setWebhookData(data);

      // Show alert
      setAlertMessage("✅ Webhook received successfully!");
      setIsAlertVisible(true);

      // Hide alert after 3 seconds
      setTimeout(() => setIsAlertVisible(false), 3000);
    });

    return () => {
      console.log("Cleaning up socket connection...");
      socket.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col space-y-10 sm:space-y-12">
      {/* Alert Message */}
      {isAlertVisible && (
        <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded shadow-lg">
          {alertMessage}
        </div>
      )}

      <div className="flex flex-col items-center text-center space-y-8">
        <CircularProgressBar value={100} error={error} />

        {error ? (
          <div className="w-full space-y-8">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {error?.message || "An error occurred"}
            </h2>
            <Button block onClick={() => window.location.reload()}>Try again</Button>
          </div>
        ) : completed ? (
          <div className="w-full space-y-8">
            <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">Connected 🎉</h3>
            <Button block onClick={goForward}>Continue</Button>
          </div>
        ) : (
          <div className="w-full space-y-8">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Waiting for Webhook Event...
            </h2>
          </div>
        )}

        {/* Display webhook event data for debugging */}
        {webhookData && (
          <div className="mt-8 w-full bg-gray-100 p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Webhook Event Data</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(webhookData, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <AccountVerificationFormResumeInBackgroundModal />
    </div>
  );
}
