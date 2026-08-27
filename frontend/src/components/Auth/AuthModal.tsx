import React, { useState } from "react";
import { X, Mail, Lock, User as UserIcon, Phone, Loader2, LogIn, UserPlus, AlertCircle } from "lucide-react";

import axiosInstance from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import { showToast } from "../AlertBox";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "signin" | "signup";
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = "signin",
  onSuccess
}) => {
  const { login } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">(defaultTab);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sign In fields
  const [signInIdentifier, setSignInIdentifier] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up fields
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInIdentifier.trim() || !signInPassword.trim()) {
      setErrorMsg("Please enter your email/phone and password");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await axiosInstance.post("/auth/userLogin", {
        email: signInIdentifier.trim(),
        password: signInPassword.trim()
      });

      if (res.data?.success && res.data?.accessToken) {
        const userData = res.data.User || res.data.user || {
          userId: res.data.id,
          username: res.data.name || "User",
          email: res.data.email,
          role: res.data.role || "user"
        };

        login(res.data.accessToken, userData);
        showToast("Signed in successfully!", "success");
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res.data?.message || "Invalid credentials. Please try again.");
      }
    } catch (err: any) {
      console.error("Sign In Error:", err);
      const msg = err.response?.data?.message || err.message || "Invalid email/phone or password";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim()) {
      setErrorMsg("Please enter your full name");
      return;
    }
    if (!signUpEmail.trim() && !signUpPhone.trim()) {
      setErrorMsg("Please enter an email address or mobile number");
      return;
    }
    if (signUpPhone.trim() && !/^\+?[0-9]{10,13}$/.test(signUpPhone.replace(/\D/g, ""))) {
      setErrorMsg("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!signUpPassword || signUpPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await axiosInstance.post("/auth/createUser", {
        username: signUpName.trim(),
        email: signUpEmail.trim() || undefined,
        mobile: signUpPhone.trim() || undefined,
        password: signUpPassword,
        role: "user"
      });

      if (res.data?.success) {
        const token = res.data.accessToken;
        const userData = res.data.User || res.data.user || {
          userId: res.data.id || res.data.userId,
          username: signUpName.trim(),
          email: signUpEmail.trim(),
          mobile: signUpPhone.trim(),
          role: "user"
        };

        if (token) {
          login(token, userData);
        }

        showToast("Account created successfully!", "success");
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res.data?.message || "Failed to create account. Please try again.");
      }
    } catch (err: any) {
      console.error("Sign Up Error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to create account. Email or phone may already exist.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 sm:p-8 space-y-6 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-3">
            {tab === "signin" ? <LogIn size={24} /> : <UserPlus size={24} />}
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            {tab === "signin" ? "Welcome Back" : "Create an Account"}
          </h3>
          <p className="text-xs text-slate-500">
            {tab === "signin" 
              ? "Sign in to access your rides and instant bookings" 
              : "Sign up in seconds to book verified cabs"}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => { setTab("signin"); setErrorMsg(null); }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              tab === "signin"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab("signup"); setErrorMsg(null); }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              tab === "signup"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Sign In Form */}
        {tab === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email or Mobile Number
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="text"
                  value={signInIdentifier}
                  onChange={(e) => { setSignInIdentifier(e.target.value); setErrorMsg(null); }}
                  placeholder="name@example.com or 9876543210"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white text-sm font-semibold text-slate-900 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  value={signInPassword}
                  onChange={(e) => { setSignInPassword(e.target.value); setErrorMsg(null); }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white text-sm font-semibold text-slate-900 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>

            <div className="pt-3 text-center border-t border-slate-100 mt-3">
              <p className="text-xs text-slate-500">
                Are you an EasyRide Driver?{" "}
                <a
                  href="/driver/login"
                  onClick={() => onClose()}
                  className="font-bold text-amber-600 hover:text-amber-700 hover:underline"
                >
                  Driver Login Portal →
                </a>
              </p>
            </div>
          </form>
        )}


        {/* Sign Up Form */}
        {tab === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <UserIcon size={16} />
                </div>
                <input
                  type="text"
                  value={signUpName}
                  onChange={(e) => { setSignUpName(e.target.value); setErrorMsg(null); }}
                  placeholder="Your Name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mobile Number *
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Phone size={16} />
                </div>
                <input
                  type="tel"
                  value={signUpPhone}
                  onChange={(e) => { setSignUpPhone(e.target.value); setErrorMsg(null); }}
                  placeholder="10-digit mobile number"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address (Optional)
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={signUpEmail}
                  onChange={(e) => { setSignUpEmail(e.target.value); setErrorMsg(null); }}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Create Password *
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  value={signUpPassword}
                  onChange={(e) => { setSignUpPassword(e.target.value); setErrorMsg(null); }}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-amber-500 focus:bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50 pt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Free Account</span>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default AuthModal;
