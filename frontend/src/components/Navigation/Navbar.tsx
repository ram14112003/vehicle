import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Car, 
  Calendar, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X, 
  Phone, 
  Mail, 
  ChevronDown, 
  ShieldCheck,
  Bell
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AuthModal from "../Auth/AuthModal";
import axiosInstance from "../../utils/axiosInstance";

interface CustomerNotificationItem {
  notificationId: string;
  userId: string;
  bookingId?: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  booking?: {
    bookingCode: string;
    pickupPoint: string;
    dropPoint: string;
    bookingDate: string;
    bookingTime: string;
    driver?: {
      driverName: string;
      phno: string;
    };
    vehicle?: {
      vehicleName: string;
      vehicleNo?: string;
    };
  };
}


interface NavbarProps {
  transparent?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ transparent = false }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"signin" | "signup">("signin");
  
  // Customer Notification State
  const [notifications, setNotifications] = useState<CustomerNotificationItem[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState<boolean>(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const displayName = user?.username || user?.name || localStorage.getItem("username") || "User";
  const role = user?.role || localStorage.getItem("role") || "";

  // Fetch Customer Notifications
  const fetchCustomerNotifications = async () => {
    const uid = (user as any)?.userId || localStorage.getItem("userId") || localStorage.getItem("id");
    if (!uid) return;
    try {
      const res = await axiosInstance.get(`/order/customer/notifications/${uid}`);
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        setUnreadNotifCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.warn("Customer notification polling notice:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomerNotifications();
      const interval = setInterval(fetchCustomerNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const handleMarkNotificationRead = async (notifId: string) => {
    try {
      await axiosInstance.put(`/order/customer/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === notifId ? { ...n, isRead: true } : n))
      );
      setUnreadNotifCount((prev) => Math.max(0, prev - 1));
      setNotifDropdownOpen(false);
      navigate("/my-bookings");
    } catch (err) {
      navigate("/my-bookings");
    }
  };

  const handleMarkAllRead = async () => {
    const uid = (user as any)?.userId || localStorage.getItem("userId") || localStorage.getItem("id");
    if (!uid) return;
    try {
      await axiosInstance.put(`/order/customer/notifications/mark-all-read/${uid}`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate("/");
  };

  const openSignIn = () => {
    setAuthDefaultTab("signin");
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };


  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Top Notification / Contact Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-8 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-6">
          <a href="tel:+919841722675" className="flex items-center gap-1.5 hover:text-amber-400 transition-colors">
            <Phone size={13} className="text-amber-400" />
            <span className="font-medium">+91 98417 22675</span>
          </a>
          <a href="mailto:support@easyride.in" className="hidden sm:flex items-center gap-1.5 hover:text-amber-400 transition-colors">
            <Mail size={13} className="text-amber-400" />
            <span>support@easyride.in</span>
          </a>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="hidden md:inline-flex items-center gap-1 text-emerald-400 font-medium">
            <ShieldCheck size={13} /> 24/7 Verified Chauffeurs & Corporate Cabs
          </span>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-slate-400">
                Welcome, <strong className="text-white font-semibold">{displayName}</strong>
              </span>
              {role === "driver" && (
                <Link
                  to="/driver/dashboard"
                  className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors text-[10px]"
                >
                  Driver Portal →
                </Link>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={openSignIn}
                className="hover:text-amber-400 transition-colors font-medium text-slate-300"
              >
                Sign In / Register
              </button>
              <span className="text-slate-600">|</span>
              <Link
                to="/driver/login"
                className="text-amber-400 hover:text-amber-300 font-bold transition-colors flex items-center gap-1"
              >
                <Car size={12} /> Driver Login →
              </Link>
            </div>
          )}
        </div>
      </div>


      {/* Main Navbar */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled || !transparent
            ? "bg-white/95 backdrop-blur-md shadow-md border-b border-slate-200/80 py-3"
            : "bg-white/90 backdrop-blur-sm py-4 border-b border-slate-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Car className="text-slate-950 w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Easy<span className="text-amber-500 ml-0.5">Ride</span>
              </div>
              <p className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase -mt-1">
                Reliable Rides Everyday
              </p>
            </div>
          </Link>


          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/"
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                isActive("/") && location.pathname === "/"
                  ? "text-amber-600 bg-amber-50"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Home
            </Link>

            <Link
              to="/book"
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                isActive("/book")
                  ? "text-amber-600 bg-amber-50"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Book a Ride
            </Link>

            <Link
              to="/my-bookings"
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                isActive("/my-bookings")
                  ? "text-amber-600 bg-amber-50"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              My Bookings
            </Link>

            <a
              href="/#fleet"
              className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
              Fleet
            </a>

            <a
              href="/#why-us"
              className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
              Why Us
            </a>
          </nav>

          {/* Desktop Right CTA / User Profile & Notifications */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotifDropdownOpen(!notifDropdownOpen);
                    setUserDropdownOpen(false);
                  }}
                  className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 transition-colors"
                  title="Notifications"
                >
                  <Bell size={18} />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
                      {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                    </span>
                  )}
                </button>

                {notifDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onMouseLeave={() => setNotifDropdownOpen(false)}
                  >
                    <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">Notifications</span>
                        {unreadNotifCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            {unreadNotifCount} new
                          </span>
                        )}
                      </div>
                      {unreadNotifCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-amber-600 hover:text-amber-700 font-bold hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400">
                          <Bell size={24} className="mx-auto mb-2 opacity-40" />
                          <p className="text-xs font-semibold text-slate-600">No notifications yet</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Updates on driver assignments and trip status will appear here.
                          </p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.notificationId}
                            className={`p-3.5 hover:bg-slate-50 transition-colors ${
                              !n.isRead ? "bg-amber-50/40" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                                <span>{n.title}</span>
                              </div>
                              {!n.isRead && (
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
                              )}
                            </div>

                            <div className="mt-1 text-[11px] text-slate-600 whitespace-pre-line leading-relaxed font-medium bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                              {n.message}
                            </div>

                            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                              <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <button
                                type="button"
                                onClick={() => handleMarkNotificationRead(n.notificationId)}
                                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] shadow-xs"
                              >
                                View Booking →
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setNotifDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-sm font-semibold transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs shadow-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{displayName}</span>
                  <ChevronDown size={16} className={`text-slate-500 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-500 font-medium">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-bold tracking-wider">
                        {role || "User"}
                      </span>
                    </div>

                    <Link
                      to="/my-bookings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-amber-600"
                    >
                      <Calendar size={16} /> My Bookings
                    </Link>

                    {role === "driver" && (
                      <Link
                        to="/driver/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-amber-600 bg-amber-50 hover:bg-amber-100"
                      >
                        <Car size={16} /> Driver Portal
                      </Link>
                    )}

                    {role === "superadmin" && (
                      <Link
                        to="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-amber-600"
                      >
                        <UserIcon size={16} /> Admin Dashboard
                      </Link>
                    )}


                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={openSignIn}
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors"
              >
                Sign In
              </button>
            )}

            <Link
              to="/book"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              <Car size={18} />
              Book a Ride
            </Link>
          </div>


          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/book"
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-1"
            >
              <Car size={14} /> Book
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-800 hover:bg-slate-100"
            >
              Home
            </Link>
            <Link
              to="/book"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-800 hover:bg-slate-100"
            >
              Book a Ride
            </Link>
            <Link
              to="/my-bookings"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-800 hover:bg-slate-100"
            >
              My Bookings
            </Link>
            <a
              href="/#fleet"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-800 hover:bg-slate-100"
            >
              Fleet & Vehicles
            </a>
            <a
              href="/#why-us"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-semibold text-slate-800 hover:bg-slate-100"
            >
              Why EasyRide
            </a>


            <div className="pt-3 border-t border-slate-100">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="px-3 py-1.5 text-xs text-slate-500 font-medium">
                    Signed in as <strong className="text-slate-900">{displayName}</strong>
                  </div>
                  {role === "driver" && (
                    <Link
                      to="/driver/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg text-sm font-bold text-amber-600 bg-amber-50"
                    >
                      Driver Dashboard
                    </Link>
                  )}
                  {role === "superadmin" && (
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={openSignIn}
                      className="w-full text-center px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 font-bold text-sm hover:bg-slate-50"
                    >
                      Sign In
                    </button>
                    <Link
                      to="/book"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm shadow-md"
                    >
                      Book Ride
                    </Link>
                  </div>
                  <Link
                    to="/driver/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center py-2.5 px-4 rounded-xl bg-slate-900 text-amber-400 font-bold text-xs shadow-sm hover:bg-slate-800"
                  >
                    🚗 Driver Login / Portal →
                  </Link>
                </div>
              )}

            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authDefaultTab}
      />
    </>
  );
};

export default Navbar;


