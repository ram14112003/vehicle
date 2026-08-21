import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';
import {
  LogOut,
  ShieldCheck,
  ChevronRight,
  LayoutDashboard,
  CalendarCheck,
  Car,
  Users
} from 'lucide-react';


const Header: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Authenticated user/admin details from storage
  const rawRole = localStorage.getItem('role') || 'Super Admin';
  const rawUsername = localStorage.getItem('username') || '';
  const displayName = rawUsername || (rawRole.toLowerCase().includes('super') ? 'Super Admin' : 'Administrator');

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    localStorage.clear();
    navigate('/adminlogin');
  };

  // Derive subtle section label based on current route
  const getRouteLabel = () => {
    const p = location.pathname.toLowerCase();
    if (p.includes('/orders')) return { label: 'Bookings Management', icon: <CalendarCheck size={14} className="text-amber-500" /> };
    if (p.includes('/vehicle') || p.includes('/pricing')) return { label: 'Fleet & Pricing', icon: <Car size={14} className="text-amber-500" /> };
    if (p.includes('/users')) return { label: 'Users Directory', icon: <Users size={14} className="text-amber-500" /> };
    return { label: 'Admin Dashboard', icon: <LayoutDashboard size={14} className="text-amber-500" /> };
  };

  const currentRoute = getRouteLabel();

  return (
    <>
      <header className="h-14 sm:h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-xs sticky top-0 z-30 transition-all">
        {/* Left Section: Active Context */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-800 text-xs font-bold">
            {currentRoute.icon}
            <span className="hidden sm:inline text-slate-400 font-semibold">Portal</span>
            <ChevronRight size={12} className="hidden sm:inline text-slate-300" />
            <span className="text-slate-900 font-extrabold">{currentRoute.label}</span>
          </div>

          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live System
          </span>
        </div>

        {/* Right Section: Admin Profile + Logout */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Admin Badge */}
          <div className="flex items-center gap-2.5 py-1 px-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xs shadow-xs">
              <ShieldCheck size={16} />
            </div>
            <div className="text-left hidden xs:block">
              <div className="text-xs font-extrabold text-slate-900 leading-tight">
                {displayName}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {rawRole}
              </div>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200" />

          {/* Clean Modern Logout Button */}
          <button
            type="button"
            onClick={handleLogoutClick}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-transparent hover:border-rose-200 text-xs font-bold transition-all shadow-xs"
            title="Sign out of Admin Portal"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Sign Out?"
        description="Are you sure you want to log out of the Grace Cabs Admin Portal?"
        confirmText="Yes, Sign Out"
        cancelText="Stay Logged In"
        variant="danger"
        isLoading={false}
        onConfirm={confirmLogout}
        onClose={() => setShowLogoutConfirm(false)}
      />
    </>
  );
};

export default Header;
