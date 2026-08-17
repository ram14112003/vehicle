import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";

const POLL_INTERVAL_MS = 3000;
const MAX_TRIES = 10;

// << CHANGED: reuse the same sets as backend (copy here)
const SUCCESS_HINTS = new Set(["PAID","SUCCESS","CHARGED","CAPTURED","COMPLETED"]); // FE never sends these
const FAILURE_HINTS = new Set(["FAILED","DECLINED","CANCELLED","VOID","AUTHENTICATION_FAILED","AUTHORIZATION_FAILED"]);

const PaymentReturn: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [statusText, setStatusText] = useState<string>("Checking payment status...");
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<string>("");
  const [note, setNote] = useState<string | null>(null);
  const userId = localStorage.getItem("userId");

  // Query params
  const statusFromQuery = (
    searchParams.get("status") ||
    searchParams.get("statusHint") ||
    ""
  ).toUpperCase();
  const reasonFromQuery = searchParams.get("reason") || searchParams.get("message") || searchParams.get("msg") || "";

  const orderIdFromQuery = searchParams.get("orderId") || "";
  const orderId = useMemo(() => orderIdFromQuery || sessionStorage.getItem("last_order_id") || "", [orderIdFromQuery]);

  useEffect(() => {
    if (orderIdFromQuery) {
      try { sessionStorage.setItem("last_order_id", orderIdFromQuery); } catch {}
    }
  }, [orderIdFromQuery]);

  useEffect(() => { if (reasonFromQuery) setReason(reasonFromQuery); }, [reasonFromQuery]);

  const checkStatus = useCallback(async (): Promise<{ done: boolean; status?: string; reason?: string; note?: string }> => {
    if (!orderId) {
      setStatusText("Missing Order ID");
      setLoading(false);
      return { done: true, status: "MISSING_ORDER_ID" };
    }

    try {
      const qs = new URLSearchParams({ orderId });

      // << CHANGED: never send success hints; only forward *failure* hints
      if (statusFromQuery && FAILURE_HINTS.has(statusFromQuery)) {
        qs.set("status", statusFromQuery);
      }
      // << CHANGED: do NOT send `reason` either; backend determines canonical reason
      // if (reasonFromQuery) qs.set("reason", reasonFromQuery);  // removed

      const res = await axiosInstance.get(`/paymentRoutes/payments/status?${qs.toString()}`, { timeout: 20000 });
      const s = (String(res.data?.status || "").trim() || "").toUpperCase();

      if (s === "PAID" || s === "SUCCESS" || s === "CHARGED") {
        setStatusText("✅ Payment Successful!");
        setReason("");
        setLoading(false);
        try { sessionStorage.removeItem("last_order_id"); } catch {}
        return { done: true, status: "PAID" };
      }

      if (s === "FAILED" || s === "DECLINED") {
        setStatusText("❌ Payment Failed. Please try again.");
        setReason(reasonFromQuery || res.data?.reason || "");
        setLoading(false);
        try { sessionStorage.removeItem("last_order_id"); } catch {}
        return { done: true, status: "FAILED", reason: res.data?.reason || reasonFromQuery };
      }

      if (s === "CANCELLED") {
        setStatusText("❌ Payment Cancelled.");
        setLoading(false);
        try { sessionStorage.removeItem("last_order_id"); } catch {}
        return { done: true, status: "CANCELLED" };
      }

      // Unverified note from backend (PG temporary error)
      if (res.data?.note === "unverified") {
        setNote("Status unverified with gateway — contact support if money was deducted.");
      } else {
        setNote(null);
      }

      setStatusText("⚙️ Payment is still processing...");
      return { done: false, status: "PENDING" };
    } catch (err: any) {
      console.error("Status check error:", err);
      const statusCode = err?.response?.status;
      if (statusCode === 404) {
        setReason("status_check_error");
        setStatusText("❌ Payment Failed. Please try again.");
      } else {
        setReason(err?.message || "status_check_error");
        setStatusText("Error checking payment status.");
      }
      setLoading(false);
      try { sessionStorage.removeItem("last_order_id"); } catch {}
      return { done: true, status: "ERROR", reason: reason || err?.message || "status_check_error" };
    }
  }, [orderId, statusFromQuery, reasonFromQuery]);

  useEffect(() => {
    // << CHANGED: If query shows a *success* hint, display a verifying message
    // but DO NOT pass that hint to backend (handled in checkStatus())
    if (SUCCESS_HINTS.has(statusFromQuery)) {
      setStatusText("✅ Payment Successful! (verifying…)");
      (async () => { await checkStatus(); })();
      return;
    }

    if (FAILURE_HINTS.has(statusFromQuery)) {
      setStatusText("❌ Payment Failed. (verifying…)");
      (async () => { await checkStatus(); })();
      return;
    }

    if (statusFromQuery === "CANCELLED") {
      setStatusText("❌ Payment Cancelled.");
      setLoading(false);
      checkStatus(); // single verification
      return;
    }

    let tries = 0;
    let stopped = false;
    const tick = async () => {
      const { done } = await checkStatus();
      tries += 1;
      if (!done && tries < MAX_TRIES && !stopped) {
        setTimeout(tick, POLL_INTERVAL_MS);
      } else {
        stopped = true;
      }
    };
    tick();
    return () => { stopped = true; };
  }, [statusFromQuery, checkStatus]);

  const onRetry = async () => {
    setLoading(true);
    setStatusText("Re-checking payment status…");
    await checkStatus();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-[420px] text-center">
        <h1 className="text-xl font-bold mb-2">Payment Status</h1>
        <div className="min-h-[56px]">
          {loading ? (
            <p className="text-gray-600">Please wait…</p>
          ) : (
            <>
              <p className={`text-lg font-semibold ${statusText.includes("✅") ? "text-green-600" : statusText.includes("❌") ? "text-red-600" : "text-gray-700"}`}>
                {statusText}
              </p>
              {reason && <p className="mt-2 text-sm text-gray-500 break-words">Reason: {reason}</p>}
              {note && <p className="mt-2 text-sm text-yellow-600 break-words">Note: {note}</p>}
            </>
          )}
        </div>

        {orderId && <p className="mt-2 text-sm text-gray-500">Order ID: {orderId}</p>}

        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={onRetry} className="inline-block bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200" disabled={loading}>
            Retry
          </button>

          <a href={`/users/useraccount/${userId || ""}`} className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Home</a>

          <button onClick={() => navigate("/invoices")} className="inline-block bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200">
            View Invoices
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentReturn;
