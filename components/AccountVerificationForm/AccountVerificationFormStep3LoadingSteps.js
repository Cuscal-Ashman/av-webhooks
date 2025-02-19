import { useEffect, useState } from "react";
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
  const { error, completed, stepNameInProgress, reset, setJobId } = basiqConnection;

  const [progress, setProgress] = useState(0);
  const [localJobId, setLocalJobId] = useState(null);
  const [webhookData, setWebhookData] = useState(null);

  // Extract job ID from URL query parameter
  useEffect(() => {
    const jobIdsParam = new URLSearchParams(window.location.search).get("jobIds");
    if (jobIdsParam) {
      const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;
      const uuids = jobIdsParam.match(uuidRegex);
      const extractedJobId = uuids && uuids.length > 0 ? uuids[0] : jobIdsParam;
      setLocalJobId(extractedJobId);
      setJobId(extractedJobId);
    } else {
      console.warn("⚠️ No jobIds query param found.");
    }
  }, [setJobId]);

  // Function to poll webhook data
  const pollWebhookData = async () => {
    try {
      const response = await fetch("/api/webhook");
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      if (data.message !== "No webhook data received yet") {
        setWebhookData(data);
        console.log("📩 Received webhook data:", data);

        if (data.data.eventTypeId === "transactions.updated" && localJobId) {
          setProgress(100);
          setJobId(localJobId);
          // pollJobEndpoint(localJobId);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching webhook data:", error);
    }
  };

  // Function to call job endpoint
  async function pollJobEndpoint(jobId) {
    if (!jobId) return;
    try {
      console.log("🚀 Checking job status for jobId:", jobId);
      const response = await fetch(`/api/job-status/${jobId}`);
      const data = await response.json();

      if (data.completed) {
        console.log("✅ Job completed!", data);
      } else {
        console.log("⏳ Job still in progress...", data);
        setTimeout(() => pollJobEndpoint(jobId), 2000);
      }
    } catch (error) {
      console.error("❌ Error polling job endpoint:", error);
    }
  }

  // Poll for webhook data every 5 seconds
  useEffect(() => {
    const intervalId = setInterval(pollWebhookData, 5000);
    pollWebhookData(); // Initial poll
    return () => clearInterval(intervalId);
  }, [localJobId]);

  return (
    <div className="flex flex-col space-y-10 sm:space-y-12">
      <div className="flex flex-col items-center text-center space-y-8">
        <CircularProgressBar value={progress} error={error} />

        {error ? (
          <div className="w-full space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {error?.response?.data.data[0]?.detail}
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

        {/* ✅ Display Webhook Data in UI */}
        {webhookData && (
          <div className="mt-8 w-full bg-gray-100 p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Webhook Event Data</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(webhookData.data, null, 2)}
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
