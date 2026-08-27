import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Car, Phone, Lock, Eye, EyeOff, LogIn, ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import axiosInstance from "../../../utils/axiosInstance";
import { useAuth } from "../../../context/AuthContext";
import { showToast, AlertContainer } from "../../../components/AlertBox";

const DriverLogin: React.FC = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      setErrorMsg("Please enter your registered mobile number or email");
      return;
    }
    if (!cleanPass) {
      setErrorMsg("Please enter your password");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post("/driver/login", {
        identifier: cleanId,
        password: cleanPass
      });

      if (res.data?.success && (res.data?.accessToken || res.data?.token)) {
        const token = res.data.accessToken || res.data.token;
        const driverData = res.data.driver || {};
        const driverId = res.data.id || res.data.driverId || driverData.driverId;
        const driverName = driverData.driverName || "Driver";

        const driverUserObj = {
          userId: driverId,
          id: driverId,
          driverId: driverId,
          username: driverName,
          name: driverName,
          email: driverData.driverEmail || "",
          mobile: driverData.phno || "",
          role: "driver",
          status: driverData.status || "AVAILABLE",
          isAvailable: true,
          vehicleName: driverData.vehicleName || "",
          vehicleNumber: driverData.vehicleNumber || "",
          token
        };

        localStorage.setItem("token", token);
        localStorage.setItem("accessToken", token);
        localStorage.setItem("role", "driver");
        localStorage.setItem("userId", driverId);
        localStorage.setItem("driverId", driverId);
        localStorage.setItem("username", driverName);
        localStorage.setItem("user", JSON.stringify(driverUserObj));

        login(token, driverUserObj);
        showToast("Welcome back! Status set to AVAILABLE.", "success");
        navigate("/driver/dashboard");
      } else {
        setErrorMsg(res.data?.message || "Invalid credentials. Please verify and try again.");
      }
    } catch (err: any) {
      console.error("Driver login error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to login. Please check credentials.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <AlertContainer />
      
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

      {/* Top Header & Back Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-400 text-xs font-semibold mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to EasyRide Home
        </Link>

        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Car className="text-slate-950 w-7 h-7" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-white">
              Easy<span className="text-amber-500">Ride</span>
            </span>
            <span className="block text-[11px] font-bold uppercase tracking-widest text-amber-400 -mt-1">
              Driver Portal
            </span>
          </div>
        </div>

        <h2 className="mt-6 text-center text-2xl sm:text-3xl font-black text-white tracking-tight">
          Driver Sign In
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-400">
          Enter your registered mobile number and password to access your rides
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-800">
          
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={18} />
              <p className="text-xs sm:text-sm text-rose-300 font-medium">{errorMsg}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Mobile Number or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Phone size={18} />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="e.g. 9876543210 or driver@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border-2 border-slate-800 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-11 py-3 bg-slate-950 border-2 border-slate-800 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Sign In to Driver Dashboard</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick links & help */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center space-y-3">
            <p className="text-xs text-slate-300">
              New Chauffeur?{" "}
              <Link to="/driver/register" className="font-bold text-amber-400 hover:underline">
                Create Driver Account →
              </Link>
            </p>
            <p className="text-xs text-slate-400">
              Not a driver?{" "}
              <Link to="/book" className="font-bold text-slate-300 hover:text-white hover:underline">
                Book a Cab as Customer
              </Link>
            </p>
            <p className="text-[11px] text-slate-500">
              Admin & Fleet Managers:{" "}
              <Link to="/adminlogin" className="font-semibold text-slate-400 hover:text-white hover:underline">
                Admin Login
              </Link>
            </p>
          </div>

        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-xs">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Secured EasyRide Driver Authentication</span>
        </div>
      </div>
    </div>
  );
};

export default DriverLogin;
