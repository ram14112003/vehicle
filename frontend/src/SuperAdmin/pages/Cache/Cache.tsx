import React, { useState } from "react";
import PageLayout from "../../../components/PageLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Cache: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClear = () => {
    setIsProcessing(true);

    // Simulate clearing process with delay
    setTimeout(() => {
      //  Only clear browser cache, NOT localStorage/sessionStorage
      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }

      setIsProcessing(false);

      // Show success toast
      toast.success("Cache cleared successfully!", {
        position: "top-right",
        autoClose: 2000,
      });

      //  Just refresh page (don’t logout or clear login data)
      setTimeout(() => {
        window.location.reload(); // refresh only
      }, 2000);
    }, 1500); // 1.5 sec "processing"
  };

  return (
    <PageLayout>
      <div>
        <main className="py-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Clear Cache</h1>

          <div className="rounded-lg p-8">
            <h2 className="text-xl font-semibold text-[#275981] mb-4 flex items-center gap-2">
              Clear Cache
            </h2>

            <div className="flex flex-col items-center">
              <button
                onClick={handleClear}
                disabled={isProcessing}
                className={`text-white px-6 py-2 rounded mb-2 ${
                  isProcessing
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  "Clear"
                )}
              </button>
              <p className="text-sm text-gray-600">
                Click here to clear only browser cache files.
              </p>
            </div>
          </div>
        </main>

        <ToastContainer />
      </div>
    </PageLayout>
  );
};

export default Cache;
