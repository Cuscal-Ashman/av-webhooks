import { useEffect, useState } from "react";
import io from "socket.io-client";
import { useTernaryState } from "../../utils/useTernaryState";
import { Button } from "../Button";
import { CircularProgressBar } from "../CircularProgressBar";
import { useAccountVerificationForm } from "./AccountVerificationFormProvider";
import { AccountVerificationFormResumeInBackgroundModal } from "./AccountVerificationFormResumeInBackgroundModal";

const STEP_NAME_MAP = {
  "verify-credentials": "Verifying credentials...",
  "retrieve-accounts": "Retrieving accounts...",
};

export function AccountVerificationFormStep3LoadingSteps() {
  // Manage resume modal visibility
  const [isResumeModalOpen, openResumeModal, closeResumeModal] = useTernaryState(false);
  const { basiqConnection, goForward } = useAccountVerificationForm();
  const { error, completed, stepNameInProgress, reset, setJobId } = basiqConnection;
  
  // Loading progress state
  const [progress, setProgress] = useState(0);
  // Local job ID from URL
  const [localJobId, setLocalJobId] = useState(null);
  // Store incoming webhook event data (for debugging/display purposes)
  const [webhookData, setWebhookData] = useState(null);

  // Extract job ID from the URL query parameter
  useEffect(() => {
    const jobIdsParam = new URLSearchParams(window.location.search).get("jobIds");
    if (jobIdsParam) {
      // Try to extract a valid UUID from the parameter
      const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;
      const uuids = jobIdsParam.match(uuidRegex);
      const extractedJobId = uuids && uuids.length > 0 ? uuids[0] : jobIdsParam;
      setLocalJobId(extractedJobId);

      // Optionally, update progress immediately if a valid UUID was found.
      if (uuids && uuids.length > 0) {
        setProgress(100);
        setJobId(extractedJobId);
      } else {
        setProgress(0);
        setJobId(extractedJobId);
      }
    } else {
      console.warn("No jobIds query param found.");
    }
  }, [setJobId]);

  // Initialize Socket.IO client and listen for webhook events
  useEffect(() => {
    if (typeof window === "undefined") return;

    const socket = io(window.location.origin, { path: "/api/socketio" });

    socket.on("connect", () => {
      console.log("Socket connected with id:", socket.id);
    });

    socket.on("webhookEvent", (data) => {
      console.log("Received webhook event:", data);
      setWebhookData(data);

      // When a "transactions.updated" event is received and we have a job ID, update progress
      if (data.eventTypeId === "transactions.updated" && localJobId) {
        setProgress(100);
        setJobId(localJobId);
        // Disconnect the socket after processing the event
        socket.disconnect();
        // Optionally call the job endpoint here if needed
        // pollJobEndpoint();  // Alternatively, call it on disconnect
      }
    });

    // If you prefer to trigger your job call when the socket disconnects:
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      // Here you can call your job endpoint
      pollJobEndpoint(localJobId);
    });

    // Cleanup on unmount
    return () => {
      console.log("Disconnecting socket");
      socket.disconnect();
    };
  }, [localJobId, setJobId]);

  return (
    <div className="flex flex-col space-y-10 sm:space-y-12">
      <div className="flex flex-col items-center text-center space-y-8">
        <CircularProgressBar value={progress} error={error} />

        {error ? (
          <div className="w-full space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {error?.response?.data.data[0].detail}
              </h2>
              <p className="text-sm sm:text-base text-neutral-muted-darker">
                {error?.message}
              </p>
            </div>
            <Button block onClick={reset}>
              Try again
            </Button>
          </div>
        ) : completed ? (
          <div className="w-full space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Connected 🎉
              </h3>
              <p className="text-sm sm:text-base text-neutral-muted-darker">
                One last step to go...
              </p>
            </div>
            <Button block onClick={goForward}>
              Continue
            </Button>
          </div>
        ) : (
          <div className="w-full space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {STEP_NAME_MAP[stepNameInProgress]}
              </h2>
            </div>
            <Button block variant="subtle" onClick={openResumeModal}>
              Resume in background
            </Button>
          </div>
        )}

        {/* (Optional) Display the webhook event data */}
        {webhookData && (
          <div className="mt-8 w-full bg-gray-100 p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Webhook Event Data</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(webhookData, null, 2)}
            </pre>
          </div>
        )}
      </div>
      <AccountVerificationFormResumeInBackgroundModal
        isOpen={isResumeModalOpen}
        onClose={closeResumeModal}
      />
    </div>
  );
}

/**
 * Example implementation of pollJobEndpoint.
 * This function should contain the logic to fetch the current status of the job.
 * For example, it might call a REST API endpoint that returns job details.
 */
async function pollJobEndpoint(jobId) {
  if (!jobId) return;
  
  try {
    console.log("Polling job endpoint for jobId:", jobId);
    // Replace with your actual job endpoint
    const response = await fetch(`/api/job-status/${jobId}`);
    const data = await response.json();
    
    // For example, check if the job is completed and update the state or UI accordingly
    if (data.completed) {
      console.log("Job completed!", data);
      // Update state or call setJobId if needed
    } else {
      console.log("Job still in progress...", data);
      // If you need to poll repeatedly, you could set a timeout
      setTimeout(() => pollJobEndpoint(jobId), 2000);
    }
  } catch (error) {
    console.error("Error polling job endpoint:", error);
  }
}
