import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaHome,
  FaBox,
  FaUserCheck,
  FaTools,
  FaUndo,
  FaGavel,
  FaChartBar,
  FaUser,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: FaHome },
  { name: 'Assets', path: '/assets', icon: FaBox },
  { name: 'Assignments', path: '/assignments', icon: FaUserCheck },
  { name: 'Repair', path: '/repair', icon: FaTools },
  { name: 'Return', path: '/return', icon: FaUndo },
  { name: 'Auction', path: '/auction', icon: FaGavel },
  { name: 'Reports', path: '/reports', icon: FaChartBar },
  { name: 'Admin Profile', path: '/admin-profile', icon: FaUser },
];

const Sidebar = ({ isOpen, onToggle }) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl z-50 transition-all duration-300 ease-in-out ${
        isOpen ? 'w-64' : 'w-20'
      }`}>
        
        {/* Logo Section */}
        <div className="flex items-center justify-center p-6 border-b border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <img 
                src="/nepra_logo.png" 
                alt="NEPRA Logo" 
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="w-6 h-6 bg-blue-600 rounded hidden items-center justify-center">
                <span className="text-white text-xs font-bold">N</span>
              </div>
            </div>
            {isOpen && (
              <div className="overflow-hidden">
                <h1 className="text-xl font-bold text-white whitespace-nowrap">NEPRA</h1>
                <p className="text-sm text-slate-300 whitespace-nowrap">IT Asset Control</p>
              </div>
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 border-2 border-slate-600"
        >
          {isOpen ? (
            <FaChevronLeft className="text-white text-xs" />
          ) : (
            <FaChevronRight className="text-white text-xs" />
          )}
        </button>

        {/* Navigation */}
        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative
                      ${isActive 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                      }
                    `}
                    title={!isOpen ? item.name : ''}
                  >
                    {({ isActive }) => (
                      <>
                        <div className={`flex items-center justify-center w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors duration-200`}>
                          <Icon className="text-lg" />
                        </div>
                        
                        {isOpen && (
                          <span className="ml-4 font-medium whitespace-nowrap overflow-hidden">
                            {item.name}
                          </span>
                        )}

                        {/* Active Indicator */}
                        {isActive && (
                          <div className="absolute right-2 w-2 h-2 bg-white rounded-full"></div>
                        )}

                        {/* Tooltip for collapsed state */}
                        {!isOpen && (
                          <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            {item.name}
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800 rotate-45"></div>
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50">
          {isOpen ? (
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-2">Version 1.0.0</p>
              <div className="flex items-center justify-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-xs text-slate-400">System Online</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Spacer */}
      <div className={`transition-all duration-300 ${isOpen ? 'ml-64' : 'ml-20'} lg:block hidden`}></div>
    </>
  );
};

export default Sidebar;