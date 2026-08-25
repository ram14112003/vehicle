import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt,
  faClipboardList,
  faCar,
  faUsers,
  faMoneyBillWave,
  faSignOutAlt,
  faShieldAlt,
  faIdCard,
  faChartBar
} from '@fortawesome/free-solid-svg-icons';
import { NavLink, useNavigate } from 'react-router-dom';

interface NavItem {
  label: string;
  path: string;
  icon: any;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: faTachometerAlt,
  },
  {
    label: 'Bookings',
    path: '/orders',
    icon: faClipboardList,
  },
  {
    label: 'Drivers',
    path: '/drivers/list',
    icon: faIdCard,
  },
  {
    label: 'Vehicles',
    path: '/vehicle/vehicletype/list',
    icon: faCar,
  },
  {
    label: 'Users',
    path: '/users/list',
    icon: faUsers,
  },
  {
    label: 'Fleet Pricing',
    path: '/pricing',
    icon: faMoneyBillWave,
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: faChartBar,
  },
];



const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const adminName = localStorage.getItem('username') || 'Admin';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/adminlogin');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-slate-900 text-slate-200 z-40 border-r border-slate-800 shadow-2xl">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 flex-shrink-0">
          <FontAwesomeIcon icon={faCar} className="text-lg" />
        </div>
        <div>
          <h2 className="text-base font-black text-white tracking-wide">EasyRide</h2>
          <div className="flex items-center gap-1.5 mt-0.5">

            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Admin Portal</span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
          Main Management
        </div>

        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-150 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <FontAwesomeIcon
                  icon={item.icon}
                  className={`text-base w-5 text-center transition-transform duration-150 ${
                    isActive ? 'text-slate-950 scale-110' : 'text-slate-400'
                  }`}
                />
                <span className="flex-1">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Admin Profile & Logout Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/50 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black flex-shrink-0">
              <FontAwesomeIcon icon={faShieldAlt} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">{adminName}</span>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Super Admin</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-600/20 hover:text-rose-400 text-slate-400 text-xs font-bold transition-colors"
        >
          <FontAwesomeIcon icon={faSignOutAlt} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
