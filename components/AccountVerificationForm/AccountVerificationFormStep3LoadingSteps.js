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
  const [isResumeModalOpen, openResumeModal, closeResumeModal] = useTernaryState(false);
  const { basiqConnection, goForward } = useAccountVerificationForm();
  const { error, stepNameInProgress, reset, setJobId } = basiqConnection;
  
  const [progress, setProgress] = useState(0);
  const [localJobId, setLocalJobId] = useState(null);
  const [webhookData, setWebhookData] = useState(null);

  useEffect(() => {
    const jobIdsParam = new URLSearchParams(window.location.search).get("jobIds");
    if (jobIdsParam) {
      const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;
      const uuids = jobIdsParam.match(uuidRegex);
      const extractedJobId = uuids && uuids.length > 0 ? uuids[0] : jobIdsParam;
      
      setLocalJobId(extractedJobId);
      setJobId(extractedJobId);

      console.log("Extracted jobId:", extractedJobId);
    } else {
      console.warn("No jobIds query param found.");
    }
  }, [setJobId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const socket = io(window.location.origin, { path: "/api/socketio" }); // 🔥 FIX: Connect to `/api/socketio`

    socket.on("connect", () => {
      console.log("Socket connected with id:", socket.id);
    });

    socket.on("webhookEvent", (data) => {
      console.log("Received webhook event:", data);
    
      setTimeout(() => {
        setWebhookData(data);
    
        if (data.eventTypeId === "transactions.updated" && localJobId) {
          setProgress(100);
          setJobId(localJobId);
          socket.disconnect(); // ✅ Close socket upon completion
        }
      }, 2000); // Delay of 2 seconds (2000ms)
    });
    

    socket.on("disconnect", () => {
      console.log("Socket disconnected.");
    });

    return () => {
      console.log("Cleaning up socket connection...");
      socket.disconnect();
    };
  }, [localJobId, setJobId]);

  return (
    <div className="sm:space-y-12">
      <div className="flex flex-col items-center text-center space-y-8">
        <CircularProgressBar value={progress} error={error} />

        {error ? (
          <div className="w-full space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {error?.response?.data?.data[0]?.detail}
              </h2>
              <p className="text-sm sm:text-base text-neutral-muted-darker">
                {error?.message}
              </p>
            </div>
            <Button block onClick={reset}>Try again</Button>
          </div>
        ) : progress === 100 ? (
          <div className="w-full space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Connected 🎉
              </h3>
              <p className="text-sm sm:text-base text-neutral-muted-darker">
                One last step to go...
              </p>
            </div>
            <Button block onClick={goForward}>Continue</Button>
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

        {webhookData && (
          <div className="mt-8 w-full bg-gray-100 p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Webhook Event Data</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(webhookData, null, 2)}
            </pre>
          </div>
        )}
      </div>
      <AccountVerificationFormResumeInBackgroundModal isOpen={isResumeModalOpen} onClose={closeResumeModal} />
    </div>
  );
}
