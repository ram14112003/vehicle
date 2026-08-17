import React, { useState } from "react";
import axiosInstance from "../../../utils/axiosInstance";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSendOtp = async () => {
    try {
      const res = await axiosInstance.post("/auth/forgot-password/send-otp", { email });
      setMessage(res.data.message);
      setStep(2);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const res = await axiosInstance.post("/auth/forgot-password/verify-otp", { email, otp });
      setMessage(res.data.message);
      setStep(3);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Invalid OTP");
    }
  };

  const handleResetPassword = async () => {
    try {
      const res = await axiosInstance.post("/auth/forgot-password/reset", { email, newPassword });
      setMessage(res.data.message);
      setStep(1);
      setEmail("");
      setOtp("");
      setNewPassword("");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to reset password");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-white">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-blue-200">
        <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">
          Forgot Password
        </h2>
        {message && (
          <p className="text-center text-blue-600 font-medium mb-4">{message}</p>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              onClick={handleSendOtp}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
            >
              Send OTP
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter OTP"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button
              onClick={handleVerifyOtp}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
            >
              Verify OTP
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Enter new password"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              onClick={handleResetPassword}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
            >
              Reset Password
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
