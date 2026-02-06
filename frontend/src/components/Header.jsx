import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaBars,
  FaCircle,
  FaUser,
  FaSignOutAlt,
  FaChevronDown
} from 'react-icons/fa';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/assets': 'Assets',
  '/assignments': 'Assignments',
  '/repair': 'Repairs',
  '/reports': 'Reports',
  '/return': 'Returns',
  '/auction': 'Auction',
};

const Header = ({ toggleSidebar, sidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  // Get user data from localStorage
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  const currentPath = location.pathname.toLowerCase();
  const pageTitle = pageTitles[currentPath] || 'IT Asset Management';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
    setNotificationOpen(false);
  };

  const toggleNotifications = () => {
    setNotificationOpen(!notificationOpen);
    setDropdownOpen(false);
  };

  const handleMenuClick = (option) => {
    setDropdownOpen(false);
    if (option === 'Logout') {
      localStorage.removeItem('user');
      navigate('/');
    } else if (option === 'Profile') {
      navigate('/admin-profile');
    }
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 h-16 flex items-center justify-between px-6 relative z-30">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <FaBars className="text-gray-600 text-lg" />
        </button>

        {/* Desktop Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          aria-label="Toggle sidebar"
        >
          <FaBars className="text-gray-600 text-lg" />
        </button>

        {/* Page Title */}
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
          <div className="hidden md:flex items-center text-sm text-gray-500">
            <span>•</span>
            <span className="ml-2">NEPRA IT Asset Management</span>
          </div>
        </div>
      </div>

  
      <div className="flex items-center space-x-4">
       
        {/* <div className="hidden md:block relative">
          <input
            type="text"
            placeholder="Search..."
            className="w-64 px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>

        
        <div className="relative" ref={notificationRef}>
          <button
            onClick={toggleNotifications}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <FaBell className="text-lg" />
            
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          
          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">New asset added</p>
                      <p className="text-sm text-gray-500">Laptop - Oracle #123 has been added to inventory</p>
                      <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Maintenance reminder</p>
                      <p className="text-sm text-gray-500">Server maintenance scheduled for tonight</p>
                      <p className="text-xs text-gray-400 mt-1">4 hours ago</p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Assignment completed</p>
                      <p className="text-sm text-gray-500">Asset Oracle #456 has been returned</p>
                      <p className="text-xs text-gray-400 mt-1">1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-gray-200">
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div> */}

      

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-300">
              {user?.profile_picture ? (
                <img
                  src={`http://localhost:5000${user.profile_picture}`}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-gray-700 text-sm font-semibold">
                  {(user?.full_name || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900">{user?.full_name || 'User'}</p>
            </div>

            <FaChevronDown className={`text-gray-400 text-xs transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <button
                onClick={() => handleMenuClick('Profile')}
                className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                <FaUser className="text-gray-400" />
                <span>Profile</span>
              </button>

              <button
                onClick={() => handleMenuClick('Logout')}
                className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
              >
                <FaSignOutAlt className="text-red-500" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* Online Status Indicator */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-green-100 rounded-full">
          <FaCircle className="text-green-500 text-xs animate-pulse" />
          <span className="text-xs text-green-700 font-medium">Online</span>
        </div>
      </div>
    </header>
  );
};

export default Header;