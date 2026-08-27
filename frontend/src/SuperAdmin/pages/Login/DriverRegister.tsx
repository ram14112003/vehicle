import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Car, User, Phone, Mail, FileText, Lock, Eye, EyeOff, UserPlus, ArrowLeft, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import axiosInstance from "../../../utils/axiosInstance";
import { showToast, AlertContainer } from "../../../components/AlertBox";

const DriverRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    driverName: "",
    phno: "",
    driverEmail: "",
    licenseNo: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const name = formData.driverName.trim();
    const rawPhone = formData.phno.trim();
    const email = formData.driverEmail.trim();
    const license = formData.licenseNo.trim();
    const pass = formData.password.trim();
    const confirm = formData.confirmPassword.trim();

    if (!name) {
      setErrorMsg("Full name is required");
      return;
    }
    const cleanPhone = rawPhone.replace(/[^0-9+]/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid mobile number (at least 10 digits)");
      return;
    }
    if (!pass) {
      setErrorMsg("Password is required");
      return;
    }
    if (pass.length < 6) {
      setErrorMsg("Password must be at least 6 characters long");
      return;
    }
    if (pass !== confirm) {
      setErrorMsg("Password and Confirm Password do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post("/driver/register", {
        driverName: name,
        phno: cleanPhone,
        driverEmail: email || undefined,
        licenseNo: license || undefined,
        password: pass,
        confirmPassword: confirm
      });

      if (res.data?.success) {
        showToast("Registration successful! Please login to activate your availability.", "success");
        navigate("/driver/login");
      } else {
        setErrorMsg(res.data?.message || "Failed to register driver account");
      }
    } catch (err: any) {
      console.error("Driver registration error:", err);
      const msg = err.response?.data?.message || err.message || "Registration failed. Please try again.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <AlertContainer />

      {/* Decorative Gradient Orbs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

      {/* Top Header */}
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
          Chauffeur Registration
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-400">
          Create your driver account to receive bookings and manage your rides
        </p>
      </div>

      {/* Registration Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-800">
          
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={18} />
              <p className="text-xs sm:text-sm text-rose-300 font-medium">{errorMsg}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleRegister}>
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  name="driverName"
                  value={formData.driverName}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border-2 border-slate-800 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Mobile Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Phone size={18} />
                </div>
                <input
                  type="tel"
                  name="phno"
                  value={formData.phno}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border-2 border-slate-800 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Email (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  name="driverEmail"
                  value={formData.driverEmail}
                  onChange={handleChange}
                  placeholder="e.g. driver@example.com"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border-2 border-slate-800 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            {/* License Number (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Driving License Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <FileText size={18} />
                </div>
                <input
                  type="text"
                  name="licenseNo"
                  value={formData.licenseNo}
                  onChange={handleChange}
                  placeholder="e.g. TN-07-2023-1234567"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border-2 border-slate-800 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 uppercase transition-all"
                />
              </div>
            </div>

            {/* Passwords Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 6 chars"
                    className="w-full pl-11 pr-10 py-2.5 bg-slate-950 border-2 border-slate-800 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className="w-full pl-11 pr-10 py-2.5 bg-slate-950 border-2 border-slate-800 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Information Notice */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2 mt-2">
              <CheckCircle2 size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <span>
                After registering, your account will be created in <strong>Offline</strong> status. You must sign in to become <strong>Available</strong> for ride assignments.
              </span>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Registering Chauffeur...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    <span>Create Driver Account</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Switch to login */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center space-y-2">
            <p className="text-xs text-slate-400">
              Already registered as a driver?{" "}
              <Link to="/driver/login" className="font-bold text-amber-400 hover:underline">
                Sign In to Driver Portal →
              </Link>
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-xs">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Secured EasyRide Chauffeur Platform</span>
        </div>
      </div>
    </div>
  );
};

export default DriverRegister;
