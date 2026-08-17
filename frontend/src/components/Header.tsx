import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

const Header: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false)
  const role = localStorage.getItem('role') || 'User';

  const handleLogout = () => {
    setShowConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/adminlogin');
    setShowConfirm(false);
  };

  const cancelLogout = () => {
    setShowConfirm(false);
  };

  return (
    <header
      className="h-16 flex items-center justify-between px-4"
      style={{ backgroundColor: '#275981' }}
    >
      <div className="flex items-center space-x-2 text-white">
        <FontAwesomeIcon icon={faUserCircle} className="text-xl" />
        <span className="font-semibold">{role}</span>
      </div>

      <div className="relative">
        <button
          onClick={handleLogout}
          className="text-white flex items-center space-x-2 hover:text-gray-200 transition"
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="text-xl" />
          <span>Logout</span>
        </button>

        {showConfirm && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-10">
            <div className="p-2 text-sm text-gray-700">
              Are you sure you want to logout?
            </div>
            <div className="flex justify-end p-2 space-x-2">
              <button
                onClick={cancelLogout}
                className="px-4 py-1 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-100"
              >
                No
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700"
              >
                Yes
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
