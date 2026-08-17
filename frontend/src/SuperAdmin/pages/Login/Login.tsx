import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../utils/axiosInstance';
import { useAuth } from '../../../context/AuthContext';
import SimpleHeader from '../../../components/Homepage/simpleheader';
import Footer from '../../../components/Homepage/Footer';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; server?: string }>({});
  const [showForgetModal, setShowForgetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [forgetError, setForgetError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
const [step, setStep] = useState(1);
const [otp, setOtp] = useState('');

  // ----- Login Validation -----
  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email address';

    if (!password.trim()) newErrors.password = 'Password is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const res = await axiosInstance.post('/auth/emplogin', { email, password });
      const { accessToken, role, id, companyId, name } = res.data;

      if (accessToken) {
        // ✅ Store individual items
        localStorage.setItem('token', accessToken);
        localStorage.setItem('role', role);
        localStorage.setItem('userId', id);
        localStorage.setItem('username', name);
        localStorage.setItem('companyId', companyId);

        // ✅ CRITICAL FIX: Store complete user object
        const userObject = {
          userId: id,
          username: name,
          email: email,
          role: role,
          companyId: companyId,
          token: accessToken
        };
        localStorage.setItem('user', JSON.stringify(userObject));

        console.log('✅ User object stored:', userObject);

        login();

        // Navigate based on role
        if (role === "superadmin") {
          navigate('/dashboard');
        } 
        else if (role === "admin") {
          navigate('/dashboard');
        }
        else if (role === "manager") {
          navigate(`/users/useraccount/${id}`);
        } 
        else if (role === "user") {
          navigate(`/users/useraccount/${id}`);
        }
      } else {
        setErrors({ server: 'Login failed. Please try again.' });
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || 'Login failed. Please check credentials.';
      setErrors((prev) => ({ ...prev, server: errorMsg }));
    }
  };

  // ----- Forget Password Handler -----
// Step 1: Send OTP
const handleSendOtp = async () => {
  if (!email.trim()) {
    setForgetError('Email is required');
    return;
  }

  try {
    const res = await axiosInstance.post('/auth/forgetPasswordSendOtp', { email });
    setForgetError(null);
    setSuccessMsg('OTP sent to your email.');
    setStep(2);
  } catch (err: any) {
    setForgetError(err?.response?.data?.message || 'Error sending OTP');
  }
};

// Step 2: Verify OTP
const handleVerifyOtp = async () => {
  try {
    const res = await axiosInstance.post('/auth/verifyOtpPassword', { email, otp });
    if (res.data.success) {
      setSuccessMsg('OTP verified successfully.');
      setForgetError(null);
      setStep(3);
    } else {
      setForgetError(res.data.message || 'Invalid OTP');
    }
  } catch (err: any) {
    setForgetError(err?.response?.data?.message || 'Error verifying OTP');
  }
};

// Step 3: Update Password (already in your code but slightly tweaked)
const handleForgetPassword = async () => {
  if (!email.trim() || !newPassword.trim()) {
    setForgetError('All fields are required');
    return;
  }

  try {
    const res = await axiosInstance.put('/auth/forgetPassword', { email, password: newPassword });
    if (res.data.success) {
      setSuccessMsg('Password updated successfully. You can now login.');
      setTimeout(() => {
        setShowForgetModal(false);
        setStep(1);
        setEmail('');
        setNewPassword('');
        setOtp('');
      }, 2000);
    } else {
      setForgetError(res.data.message || 'Error updating password');
    }
  } catch (err: any) {
    setForgetError(err?.response?.data?.message || 'Error updating password');
  }
};


  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
     <SimpleHeader/>

      {/* Login Form */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card with glassmorphism effect */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Gradient Header */}
         <div className="bg-gradient-to-r from-[#274782] to-[#352E6B] px-8 py-8 text-center">
  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
    <Lock className="text-white" size={32} />
  </div>
  <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
  <p className="text-blue-100 text-sm">Sign in to continue your journey</p>
</div>


            <form onSubmit={handleSubmit} className="px-8 py-8" noValidate>
              {errors.server && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm text-center">{errors.server}</p>
                </div>
              )}

              {/* Email Field */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#275981]/20 transition-all ${
                      errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white focus:border-[#275981]'
                    }`}
                    value={email}
                    placeholder='Enter your email'
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-2 ml-1">{errors.email}</p>}
              </div>

              {/* Password Field */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full pl-11 pr-12 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#275981]/20 transition-all ${
                      errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white focus:border-[#275981]'
                    }`}
                    value={password}
                    placeholder='Enter your password'
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#275981] transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-2 ml-1">{errors.password}</p>}
              </div>

              {/* Login Button */}
              <button
                type="submit"
className="w-full bg-gradient-to-r from-[#274782] to-[#352E6B] text-white py-3.5 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Sign In
              </button>

              {/* Forgot Password */}
              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => {
                    if (!email.trim()) {
                      setErrors({ email: 'Email is required' });
                      return;
                    } else if (!/\S+@\S+\.\S+/.test(email)) {
                      setErrors({ email: 'Enter a valid email address' });
                      return;
                    }
                    setErrors({});
                    setShowForgetModal(true);
                  }}
                  className="text-sm text-[#275981] hover:text-[#3a7ba8] font-medium hover:underline transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            </form>
          </div>

          {/* Footer text */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Protected by industry-standard encryption
          </p>
        </div>
      </div>

      {/* Forget Password Modal */}
   {showForgetModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
      {/* Modal Header */}
      <div className="bg-gradient-to-r from-[#275981] to-[#3a7ba8] px-6 py-6">
        <h3 className="text-xl font-bold text-white">Reset Your Password</h3>
        <p className="text-blue-100 text-sm mt-1">Follow the steps to reset your password</p>
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

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <div className="relative mb-6">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
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
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#275981] to-[#3a7ba8] text-white hover:shadow-lg hover:scale-[1.02]'
                }`}
              >
                Send OTP
              </button>
            </div>
          </>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full mb-6 pl-3 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#275981] focus:ring-2 focus:ring-[#275981]/20"
              placeholder="Enter 6-digit OTP"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleVerifyOtp}
                disabled={!otp}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  !otp
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#275981] to-[#3a7ba8] text-white hover:shadow-lg hover:scale-[1.02]'
                }`}
              >
                Verify OTP
              </button>
            </div>
          </>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <>
            <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
            <div className="relative mb-6">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#275981] focus:ring-2 focus:ring-[#275981]/20"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#275981]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleForgetPassword}
                disabled={!newPassword}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  !newPassword
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#275981] to-[#3a7ba8] text-white hover:shadow-lg hover:scale-[1.02]'
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
   <Footer/>
    </div>
  );
};

export default Login;