import React from "react";
import CommonButton from "../../../components/CommonButton"; // 🔥 import your reusable button

const PaymentSuccess: React.FC = () => {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100">
      {/* Green Box */}
      <div className="w-full max-w-3xl bg-green-50 border-l-4 border-green-500 shadow p-6 text-center">
        <h2 className="text-xl font-semibold text-green-500 mb-5">
          Your Payment (Rs. 997.50) has been received successfully.
        </h2>
        <p className="text-gray-700 mb-5">
          <span className="font-medium">Your Payment Ref No :</span>{" "}
          <span className="text-gray-800">#E9F83650F67F433B9485E6C15D388358</span>
        </p>
        <p className="text-gray-700 mb-5">
          <span className="font-medium">Bank Ref No :</span>{" "}
          <span className="text-gray-800">#252465952444</span>
        </p>
        <p className="text-sm text-gray-500 mb-5">
          An email would be sent to you with the payment details.
        </p>
      </div>

      {/* Outside Footer Buttons */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <p className="text-gray-700">Click here to view</p>
        <CommonButton
          text="Payment History"
          variant="success" // uses green style from CommonButton
          onClick={() => alert("Redirecting to Payment History...")}
        />
      </div>
    </div>
  );
};

export default PaymentSuccess;
