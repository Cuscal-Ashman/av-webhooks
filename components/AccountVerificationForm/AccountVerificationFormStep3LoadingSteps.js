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
  const [isWaiting, setIsWaiting] = useState(true);
  const [pollingActive, setPollingActive] = useState(true);
  const [webhookReceived, setWebhookReceived] = useState(false); // ✅ State for webhook alert

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

  // Smooth progress increase while waiting for webhook
  useEffect(() => {
    if (progress < 90 && isWaiting && pollingActive) {
      const intervalId = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 1 : prev)); // ✅ Increase by 1% every 500ms
      }, 500);
      return () => clearInterval(intervalId);
    }
  }, [progress, isWaiting, pollingActive]);

  // Function to poll webhook data
  const pollWebhookData = async () => {
    try {
      if (!pollingActive) return;

      const response = await fetch("/api/webhook");
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      if (data.message !== "No webhook data received yet") {
        console.log("📩 Received webhook data:", data);

        if (data.data.eventTypeId === "transactions.updated" && localJobId) {
          setProgress(100);
          setJobId(localJobId);
          setIsWaiting(false);
          setPollingActive(false);
          setWebhookReceived(true); // ✅ Show webhook received alert

          // ✅ Hide the alert after 5 seconds
          setTimeout(() => {
            setWebhookReceived(false);
          }, 5000);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching webhook data:", error);
    }
  };

  // Poll for webhook data every 5 seconds
  useEffect(() => {
    if (!pollingActive) return;

    const intervalId = setInterval(pollWebhookData, 5000);
    pollWebhookData(); // Initial poll
    return () => clearInterval(intervalId);
  }, [localJobId, pollingActive]);

  return (
    <div className="flex flex-col space-y-10 sm:space-y-12 relative">
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
            <Button block onClick={reset}>Try again</Button>
          </div>
        ) : (
          <div className="w-full space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {STEP_NAME_MAP[stepNameInProgress]}
              </h2>
            </div>

            {progress < 100 && (
              <Button block variant="subtle" onClick={openResumeModal}>
                Resume in background
              </Button>
            )}
          </div>
        )}

        {completed && progress > 0 ? (
          <div className="w-full space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Connected 🎉
              </h3>
              <p className="text-sm sm:text-base text-neutral-muted-darker">
                One last step to go...
              </p>
            </div>

            {progress === 100 && <Button block onClick={goForward}>Continue</Button>}
          </div>
        ) : null}
      </div>

      <AccountVerificationFormResumeInBackgroundModal
        isOpen={isResumeModalOpen}
        onClose={closeResumeModal}
      />

      {/* ✅ Webhook Alert Box */}
      {webhookReceived && (
        <div
        className="fixed bottom-4 right-4 
                   bg-green-100 border-l-4 border-green-500 
                   text-green-800 px-4 py-3 rounded shadow-lg 
                   transition-opacity duration-500 
                   opacity-0 animate-fade-in"
        role="alert"
      >
        <div className="flex items-center">
          <svg
            className="fill-current w-5 h-5 text-green-500 mr-2"
            viewBox="0 0 20 20"
            role="img"
            aria-hidden="true"
          >
            <title>Check</title>
            <path d="M0 11l2-2 8 8L18 3l2 2-12 14z" />
          </svg>
          <p className="font-bold">Webhook received!</p>
        </div>
        <p className="text-sm">Progress complete.</p>
      </div>
      )}

      {/* ✅ Tailwind Animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
