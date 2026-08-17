import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axiosInstance from "../../../utils/axiosInstance";
import { useAuth } from "../../../context/AuthContext";
import { showToast, AlertContainer } from "../../../components/AlertBox";
import UserLoginHeader from "./userloginheader";
import Footer from "../../../components/Homepage/Footer";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

interface CompanyData {
  companyId: string;
  companyName: string;
  companyLogo: string;
  seoUrl: string;
}

const UserLogin: React.FC = () => {
  const { seoUrl } = useParams<{ seoUrl: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [companyData, setCompanyData] = useState<CompanyData | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; server?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /* ===== Forgot Password States ===== */
  const [showForgetModal, setShowForgetModal] = useState(false);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgetError, setForgetError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /* ===== Load Company ===== */
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await axiosInstance.get(`/company/${seoUrl}`);
        setCompanyData(res.data);
      } catch {
        showToast("Unable to load company details", "error");
      }
    };
    if (seoUrl) fetchCompany();
  }, [seoUrl]);

  /* ===== Login Validation ===== */
  const validate = () => {
    const err: any = {};
    if (!email.trim()) err.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) err.email = "Enter valid email";
    if (!password.trim()) err.password = "Password is required";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  /* ===== Login Submit ===== */
const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) return;
  setSubmitting(true);
  setErrors({});

  try {
    const res = await axiosInstance.post(`/auth/companyLogin`, {
      email,
      password,
      seoUrl,
    });

    const { success, User, accessToken } = res.data;

    if (!success || !User || !accessToken) {
      throw new Error("Invalid login response");
    }

    // ✅ SAME AS FIRST WORKING CODE
    const userObject = {
      userId: User.userId,
      username: User.username,
      email: User.email,
      role: User.role,
      companyId: User.companyId,
      token: accessToken,
    };

    localStorage.setItem("user", JSON.stringify(userObject));

    // ✅ CRITICAL KEYS (missing before)
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("token", accessToken);
    localStorage.setItem("role", User.role);
    localStorage.setItem("userId", User.userId);
    localStorage.setItem("username", User.username);
    localStorage.setItem("companyId", User.companyId);

    if (companyData) {
      localStorage.setItem("companySeoUrl", companyData.seoUrl);
      localStorage.setItem("companyName", companyData.companyName);
        localStorage.setItem("companyLogo", companyData.companyLogo);

    }

    await login();

  // 🔥 get companyId
const companyId = User.companyId;

try {
  const res = await axiosInstance.get(`/company/getCompanyById/${companyId}`);
  const company = res?.data?.data || res?.data;

  const name = String(company?.companyName || "").toLowerCase();
  const code = String(company?.companyCode || "").toLowerCase();
  const seo = String(company?.seoUrl || "").toLowerCase();

  const isDanfoss =
    name.includes("danfoss") ||
    code.includes("danfoss") ||
    seo.includes("danfoss");

  if (isDanfoss) {
    navigate(
      `/users/userinvoice/${User.userId}?companyId=${companyId}`,
      { replace: true }
    );
  } else {
    navigate(`/dashboard`, { replace: true });
  }

} catch (err) {
  console.error("Company fetch failed", err);
  navigate(`/dashboard`, { replace: true });
}

    showToast("Login successful", "success");
  } catch (err: any) {
    setErrors({
      server: err?.response?.data?.message || "Login failed",
    });
  } finally {
    setSubmitting(false);
  }
};


  /* ===== Forgot Password APIs ===== */

  // Step 1 – Send OTP
  const handleSendOtp = async () => {
    if (!email.trim()) {
      setForgetError("Email is required");
      return;
    }
    try {
      await axiosInstance.post("/auth/forgetPasswordSendOtp", { email });
      setForgetError(null);
      setSuccessMsg("OTP sent to your email");
      setStep(2);
    } catch (err: any) {
      setForgetError(err?.response?.data?.message || "Error sending OTP");
    }
  };

  // Step 2 – Verify OTP
  const handleVerifyOtp = async () => {
    try {
      const res = await axiosInstance.post("/auth/verifyOtpPassword", { email, otp });
      if (res.data.success) {
        setSuccessMsg("OTP verified");
        setForgetError(null);
        setStep(3);
      } else {
        setForgetError(res.data.message || "Invalid OTP");
      }
    } catch (err: any) {
      setForgetError(err?.response?.data?.message || "OTP verification failed");
    }
  };

  // Step 3 – Update Password
  const handleForgetPassword = async () => {
    if (!newPassword.trim()) {
      setForgetError("New password required");
      return;
    }
    try {
      const res = await axiosInstance.put("/auth/forgetPassword", {
        email,
        password: newPassword,
      });
      if (res.data.success) {
        setSuccessMsg("Password updated successfully");
        setTimeout(() => {
          setShowForgetModal(false);
          setStep(1);
          setOtp("");
          setNewPassword("");
        }, 1500);
      } else {
        setForgetError(res.data.message || "Password update failed");
      }
    } catch (err: any) {
      setForgetError(err?.response?.data?.message || "Error updating password");
    }
  };

  return (
    <>
      <AlertContainer />
<UserLoginHeader companyData={companyData} />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-[#274782] to-[#352E6B] px-8 py-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="text-white" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white">
                {companyData?.companyName || "User"} Login
              </h2>
              <p className="text-blue-100 text-sm mt-1">Sign in to continue</p>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="px-8 py-8 space-y-5">
              {errors.server && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {errors.server}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 py-3 border-2 rounded-xl focus:border-[#275981]"
                    placeholder="Enter Your email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 border-2 rounded-xl"
                     placeholder="Enter your password"

                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <button className="w-full bg-gradient-to-r from-[#274782] to-[#352E6B] text-white py-3.5 rounded-xl">
                {submitting ? "Signing in..." : "Sign In"}
              </button>

              <p
                onClick={() => setShowForgetModal(true)}
                className="text-center text-sm text-[#275981] cursor-pointer hover:underline"
              >
                Forgot your password?
              </p>

              <Link
                to={`/company/${seoUrl}/managerAddUser`}
                className="block text-center text-sm text-[#275981]"
              >
                Register
              </Link>
            </form>
          </div>
        </div>
      </div>

      {/* ===== Forgot Password Modal ===== */}
  {/* Forget Password Modal */}
{showForgetModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[#274782] to-[#352E6B] px-6 py-6">
        <h3 className="text-xl font-bold text-white">Reset Your Password</h3>
        <p className="text-blue-100 text-sm mt-1">
          Follow the steps to reset your password
        </p>
      </div>

      <div className="p-6">
        {forgetError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{forgetError}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{successMsg}</p>
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>

            <div className="relative mb-6">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#275981] focus:ring-2 focus:ring-[#275981]/20"
                placeholder="your@email.com"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowForgetModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleSendOtp}
                disabled={!email}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  !email
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#274782] to-[#352E6B] text-white hover:shadow-lg hover:scale-[1.02]"
                }`}
              >
                Send OTP
              </button>
            </div>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Enter OTP
            </label>

            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full mb-6 pl-3 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#275981] focus:ring-2 focus:ring-[#275981]/20"
              placeholder="Enter 6 digit OTP"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Back
              </button>

              <button
                onClick={handleVerifyOtp}
                disabled={!otp}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium ${
                  !otp
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#274782] to-[#352E6B] text-white hover:shadow-lg"
                }`}
              >
                Verify OTP
              </button>
            </div>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              New Password
            </label>

            <div className="relative mb-6">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />

              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#275981] focus:ring-2 focus:ring-[#275981]/20"
                placeholder="Enter new password"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Back
              </button>

              <button
                onClick={handleForgetPassword}
                disabled={!newPassword}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium ${
                  !newPassword
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#274782] to-[#352E6B] text-white hover:shadow-lg"
                }`}
              >
                Update Password
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  </div>
)}

      <Footer />
    </>
  );
};

export default UserLogin;