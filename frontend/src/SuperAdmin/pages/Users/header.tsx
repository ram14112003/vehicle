import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../../utils/axiosInstance';
import { Eye, EyeOff, Menu, X } from 'lucide-react';

const TravelHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get stored values after login
  const userId = localStorage.getItem("userId");
  const companyId = localStorage.getItem("companyId");
  const role = localStorage.getItem("role"); 

  // Popup states
  const [showForgetModal, setShowForgetModal] = useState(false);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgetError, setForgetError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bookingDropdownOpen, setBookingDropdownOpen] = useState(false);

  // Active helpers
  const isActiveMenu = (path: string) => location.pathname === path;

  // Any of the booking subpages active?
  const isBookingActive = [
    `/users/userbookinghistory/${userId}`,
    `/users/orderdetails/${userId}`,
    `/users/cancelledorders/${userId}`,
    `/users/paymenthistory/${userId}`,
    `/users/pendinginvoices/${userId}`,
    `/users/invoices/${userId}`,
  ].some(p => location.pathname.startsWith(p));

  const getMenuClasses = (path: string) => {
    const base = "transition duration-150";
    const active = "text-blue-500 underline underline-offset-4 decoration-2";
    const inactive = "text-gray-700 hover:text-blue-500";
    return `${base} ${isActiveMenu(path) ? active : inactive}`;
  };

  const topItemBase =
    "transition duration-150 text-gray-700 hover:text-blue-500 inline-flex items-center gap-1";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleChangePasswordClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowForgetModal(true);
    setEmail('');
    setNewPassword('');
    setForgetError(null);
    setSuccessMsg(null);
    setShowPassword(false);
    setMobileMenuOpen(false);
  };

  const handleForgetPassword = async () => {
    if (!email.trim()) return setForgetError('Email is required');
    if (!/\S+@\S+\.\S+/.test(email)) return setForgetError('Enter a valid email address');
    if (!newPassword.trim()) return setForgetError('New password is required');

    try {
      const res = await axiosInstance.put('/auth/changePassword', {
        email,
        password: newPassword,
      });

      if (res.data.success) {
        setSuccessMsg('Password changed successfully!');
        setForgetError(null);
        setTimeout(() => {
          setShowForgetModal(false);
          setEmail('');
          setNewPassword('');
        }, 2000);
      } else {
        setForgetError(res.data.message || 'Error changing password');
      }
    } catch (err: any) {
      setForgetError(err?.response?.data?.message || 'Error changing password');
    }
  };

  return (
    <>
      <header className="w-full border-b border-gray-200">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center py-2 px-3 sm:px-5 bg-gray-50 text-xs sm:text-sm border-t-4 border-gray-700 gap-2 sm:gap-0">
          {/* Contact Info - Hidden on mobile, shown on tablet+ */}
          <div className="hidden md:flex space-x-3 lg:space-x-5 text-gray-700 text-xs lg:text-sm">
            <span className="flex items-center">
              <span className="mr-1">📞</span>
              <span className="hidden lg:inline">+91-98417 22675</span>
              <span className="lg:hidden">+91-98417...</span>
            </span>
            <span className="flex items-center">
              <span className="mr-1">✉️</span>
              <span className="hidden lg:inline">traveledesk@gracecabs.com</span>
              <span className="lg:hidden">Contact</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-1 sm:space-x-1.5 w-full sm:w-auto justify-end">
            <button className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-white text-xs sm:text-sm font-medium rounded-sm bg-green-500 hover:bg-green-600 transition duration-150">
              Welcome
            </button>
            <button
              onClick={() => navigate("/users/myaccount")}
              className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-white text-xs sm:text-sm font-medium rounded-sm bg-blue-500 hover:bg-blue-600 transition duration-150"
            >
              My Account
            </button>
            <button
              onClick={handleLogout}
              className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-white text-xs sm:text-sm font-medium rounded-sm bg-red-500 hover:bg-red-600 transition duration-150"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="flex justify-between items-center py-3 px-3 sm:px-5">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/images/favicon1.jpeg"
              alt="Driver logo"
              className="h-8 w-8 sm:h-10 sm:w-10 lg:h-11 lg:w-12 rounded-full mr-2"
            />
            <span className="text-lg sm:text-2xl lg:text-3xl font-medium text-gray-800 tracking-wide">
              GRACE<span className="text-yellow-500 font-bold">C</span>ABS
            </span>
          </div>

          {/* Desktop Menu - Hidden on mobile/tablet */}
          <ul className="hidden xl:flex space-x-4 2xl:space-x-6 text-gray-700 font-medium text-sm">

               <li>
              <Link
                to={`/users/userinvoice/${userId}?companyId=${companyId}`}
                className={getMenuClasses(`/users/userinvoice/${userId}`)}
              >
                Online Booking
              </Link>
            </li>
            <li>
              <Link
                to={`/users/useraccount/${userId}`}
                className={getMenuClasses(`/users/useraccount/${userId}`)}
              >
                Dashboard
              </Link>
            </li>

         

            {role === "manager" && (
              <li>
                <Link
                  to={`/managerusers/list/${userId}`}
                  className={getMenuClasses(`/managerusers/list/${userId}`)}
                >
                  UserList
                </Link>
              </li>
            )}

            <li>
              <Link
                to={`/Users/UserEditAddressForm/${userId}?companyId=${companyId}`}
                className={getMenuClasses(`/users/usereditaddress/${userId}`)}
              >
                Edit Address
              </Link>
            </li>

            <li>
              <button
                onClick={handleChangePasswordClick}
                className={`transition duration-150 bg-transparent border-none cursor-pointer font-medium ${
                  showForgetModal
                    ? 'text-blue-500 underline underline-offset-4 decoration-2'
                    : 'text-gray-700 hover:text-blue-500'
                }`}
              >
                Change Password
              </button>
            </li>

            <li className="relative group">
              <button
                className={`${topItemBase} ${isBookingActive ? 'text-blue-500 underline underline-offset-4 decoration-2' : ''} bg-transparent border-none cursor-pointer font-medium`}
              >
                Booking History
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd" />
                </svg>
              </button>

              <div
                className="absolute left-0 top-full pt-2 w-64 hidden group-hover:block z-50"
                role="menu"
                aria-label="Booking History"
              >
                <div className="bg-white border border-gray-200 rounded-md shadow-xl relative">
                  <span className="absolute -top-2 left-6 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-orange-500"></span>

                  <ul className="py-2">
                    <li>
                      <Link
                        to={`/Users/BookingHistory/MyorderDetails/${userId}?companyId=${companyId}`}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                      >
                        My Order details
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={`/Users/BookingHistory/MycancelorderDetails/${userId}?companyId=${companyId}`}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                      >
                        My Cancel Order details
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={`/Users/BookingHistory/MypaymentHistory/${userId}?companyId=${companyId}`}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                      >
                        My Payment History
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={`/Users/BookingHistory/MypendingInvoices/${userId}?companyId=${companyId}`}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                      >
                        My Pending Invoices
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={`/Users/BookingHistory/MyInvoices/${userId}?companyId=${companyId}`}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                      >
                        My Invoices
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </li>

            <li>
              <Link
                to={`/users/uservehicledetails/${userId}`}
                className={getMenuClasses(`/users/uservehicledetails/${userId}`)}
              >
                Package Details
              </Link>
            </li>
          </ul>

          {/* Mobile Menu Button - Visible on mobile/tablet */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-gray-700 hover:text-blue-500 transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile Menu - Slide down */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-white border-t border-gray-200 shadow-lg">
            <ul className="py-2">
              <li>
                <Link
                  to={`/users/useraccount/${userId}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-5 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-500 transition"
                >
                  Dashboard
                </Link>
              </li>

              <li>
                <Link
                  to={`/users/userinvoice/${userId}?companyId=${companyId}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-5 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-500 transition"
                >
                  Online Booking
                </Link>
              </li>

              {role === "manager" && (
                <li>
                  <Link
                    to={`/managerusers/list/${userId}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-5 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-500 transition"
                  >
                    UserList
                  </Link>
                </li>
              )}

              <li>
                <Link
                  to={`/Users/UserEditAddressForm/${userId}?companyId=${companyId}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-5 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-500 transition"
                >
                  Edit Address
                </Link>
              </li>

              <li>
                <button
                  onClick={handleChangePasswordClick}
                  className="w-full text-left px-5 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-500 transition"
                >
                  Change Password
                </button>
              </li>

              {/* Booking History Accordion */}
              <li>
                <button
                  onClick={() => setBookingDropdownOpen(!bookingDropdownOpen)}
                  className="w-full flex justify-between items-center px-5 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-500 transition"
                >
                  Booking History
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transition-transform ${bookingDropdownOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd" />
                  </svg>
                </button>

                {bookingDropdownOpen && (
                  <ul className="bg-gray-50">
                    <li>
                      <Link
                        to={`/Users/BookingHistory/MyorderDetails/${userId}?companyId=${companyId}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-8 py-2.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition"
                      >
                        My Order details
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={`/Users/BookingHistory/MycancelorderDetails/${userId}?companyId=${companyId}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-8 py-2.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition"
                      >
                        My Cancel Order details
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={`/Users/BookingHistory/MypaymentHistory/${userId}?companyId=${companyId}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-8 py-2.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition"
                      >
                        My Payment History
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={`/Users/BookingHistory/MypendingInvoices/${userId}?companyId=${companyId}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-8 py-2.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition"
                      >
                        My Pending Invoices
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={`/Users/BookingHistory/MyInvoices/${userId}?companyId=${companyId}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-8 py-2.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition"
                      >
                        My Invoices
                      </Link>
                    </li>
                  </ul>
                )}
              </li>

              <li>
                <Link
                  to={`/users/uservehicledetails/${userId}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-5 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-500 transition"
                >
                  Vehicle Details
                </Link>
              </li>
            </ul>
          </div>
        )}
      </header>

      {/* Change Password Modal */}
      {showForgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4">
          <div className="bg-white w-full max-w-md p-4 sm:p-6 rounded-lg shadow-lg relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>

            {forgetError && <p className="text-red-500 text-sm mb-2">{forgetError}</p>}
            {successMsg && <p className="text-green-600 text-sm mb-2">{successMsg}</p>}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                placeholder="Enter your email"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none border-gray-300 text-sm sm:text-base"
              />
            </div>

            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                placeholder="Enter new password"
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border rounded px-3 py-2 pr-10 focus:outline-none border-gray-300 text-sm sm:text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForgetModal(false)}
                className="px-3 sm:px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleForgetPassword}
                disabled={!email || !newPassword}
                className={`px-3 sm:px-4 py-2 rounded text-white text-sm sm:text-base ${
                  !email || !newPassword
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TravelHeader;