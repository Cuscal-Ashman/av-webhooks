import { useEffect, useState } from "react";
import io from "socket.io-client";
import { Button } from "../Button";
import { CircularProgressBar } from "../CircularProgressBar";
import { useAccountVerificationForm } from "./AccountVerificationFormProvider";
import { AccountVerificationFormResumeInBackgroundModal } from "./AccountVerificationFormResumeInBackgroundModal";

export function AccountVerificationFormStep3LoadingSteps() {
  const [progress, setProgress] = useState(0);
  const [webhookData, setWebhookData] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [localJobId, setLocalJobId] = useState(null);

  const { basiqConnection, goForward } = useAccountVerificationForm();
  const { error, completed, reset, setJobId } = basiqConnection;

  // Extract job ID from URL
  useEffect(() => {
    const jobIdsParam = new URLSearchParams(window.location.search).get("jobIds");
    if (jobIdsParam) {
      const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;
      const uuids = jobIdsParam.match(uuidRegex);
      const extractedJobId = uuids ? uuids[0] : jobIdsParam;
      setLocalJobId(extractedJobId);
      setJobId(extractedJobId);
    }
  }, [setJobId]);

  // Wait for Webhook Event (No Polling)
  useEffect(() => {
    if (typeof window === "undefined" || !localJobId) return;

    const socket = io(window.location.origin, { path: "/api/socketio" });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    // Listen for webhook event
    socket.on("webhookEvent", (data) => {
      console.log("Received webhook event:", data);
      setWebhookData(data);

      if (data.eventTypeId === "transactions.updated") {
        setProgress(100);
        setJobId(localJobId);

        // Show success alert
        setAlertMessage("✅ Job Completed! Data received.");
        setIsAlertVisible(true);

        // Hide alert after 3 seconds
        setTimeout(() => setIsAlertVisible(false), 3000);

        socket.disconnect();
      }
    });

    return () => {
      console.log("Disconnecting socket...");
      socket.disconnect();
    };
  }, [localJobId, setJobId]);

  return (
    <div className="flex flex-col space-y-10 sm:space-y-12">
      {/* Alert Message */}
      {isAlertVisible && (
        <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded shadow-lg">
          {alertMessage}
        </div>
      )}

      <div className="flex flex-col items-center text-center space-y-8">
        <CircularProgressBar value={progress} error={error} />

        {error ? (
          <div className="w-full space-y-8">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {error?.response?.data?.data?.[0]?.detail || "An error occurred"}
            </h2>
            <p className="text-sm sm:text-base text-neutral-muted-darker">
              {error?.message}
            </p>
            <Button block onClick={reset}>Try again</Button>
          </div>
        ) : completed ? (
          <div className="w-full space-y-8">
            <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">Connected 🎉</h3>
            <p className="text-sm sm:text-base text-neutral-muted-darker">One last step to go...</p>
            <Button block onClick={goForward}>Continue</Button>
          </div>
        ) : (
          <div className="w-full space-y-8">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Waiting for Webhook Event...
            </h2>
          </div>
        )}

        {/* (Optional) Display webhook data for debugging */}
        {webhookData && (
          <div className="mt-8 w-full bg-gray-100 p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Webhook Event Data</h3>
            <pre className="text-xs overflow-auto">{JSON.stringify(webhookData, null, 2)}</pre>
          </div>
        )}
      </div>
      
      <AccountVerificationFormResumeInBackgroundModal />
    </div>
  );
}
