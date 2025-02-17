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
  // State for managing the resume modal
  const [isResumeModalOpen, openResumeModal, closeResumeModal] = useTernaryState(false);
  const { basiqConnection, goForward } = useAccountVerificationForm();
  const { error, completed, stepNameInProgress, reset, setJobId } = basiqConnection;

  // State for managing loading progress, jobId and payload
  const [progress, setProgress] = useState(0);
  const [localJobId, setLocalJobId] = useState(null);
  const [receivedPayload, setReceivedPayload] = useState(null);

  // (a) Extract jobId from URL and store it locally
  useEffect(() => {
    const jobIdsParam = new URLSearchParams(window.location.search).get("jobIds");
    if (jobIdsParam) {
      const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;
      const uuids = jobIdsParam.match(uuidRegex);
      setLocalJobId(uuids && uuids.length > 0 ? uuids[0] : jobIdsParam);
    } else {
      console.warn("No jobIds query param found.");
    }
  }, []);

  // (b) Initialize Socket.IO client and listen for webhook events
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Connect to our Socket.IO endpoint at /api/socketio
    const socket = io(undefined, { path: "/api/socketio" });

    socket.on("connect", () => {
      console.log("Socket connected with id:", socket.id);
    });

    socket.on("webhookEvent", (data) => {
      console.log("Received webhook event:", data);
      setReceivedPayload(data); // Store the payload to display it
      if (data.eventTypeId === "transactions.updated" && localJobId) {
        setProgress(100);
        setJobId(localJobId);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

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
              <p className="text-sm sm:text-base text-neutral-muted-darker">{error?.message}</p>
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

        {/* Display the received payload, if any */}
        {receivedPayload && (
          <div className="w-full p-4 bg-gray-100 rounded">
            <h3 className="text-lg font-semibold mb-2">Received Payload:</h3>
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(receivedPayload, null, 2)}
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
