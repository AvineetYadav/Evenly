import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
    if (notificationsOpen) setNotificationsOpen(false);
  };
  
  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (profileDropdownOpen) setProfileDropdownOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm px-4 md:px-6 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <button className="md:hidden mr-4">
            <Menu className="h-6 w-6 text-gray-500" />
          </button>
          
          <Link to="/dashboard" className="flex items-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#1CC29F" />
              <path d="M8 16H24M16 8V24" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span className="ml-2 text-xl font-semibold text-gray-800">Splitwise</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications dropdown */}
          <div className="relative">
            <button 
              onClick={toggleNotifications} 
              className="p-1.5 rounded-full hover:bg-gray-100 focus:outline-none"
            >
              <Bell className="h-5 w-5 text-gray-600" />
            </button>
            
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-dropdown z-10 py-1 animate-scale-in">
                <div className="p-3 border-b">
                  <h3 className="font-medium text-gray-800">Notifications</h3>
                </div>
                {/* Notification items would go here */}
                <div className="p-4 text-center text-gray-500">
                  No new notifications
                </div>
              </div>
            )}
          </div>
          
          {/* Profile dropdown */}
          <div className="relative">
            <button 
              onClick={toggleProfileDropdown}
              className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-gray-100 focus:outline-none"
            >
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                {user?.name.charAt(0).toUpperCase()}
              </div>
            </button>
            
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-dropdown z-10 py-1 animate-scale-in">
                <div className="px-4 py-3 border-b">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <Link 
                  to="/profile" 
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <User className="h-4 w-4 mr-2" />
                  Your Profile
                </Link>
                <button 
                  onClick={() => {
                    logout();
                    setProfileDropdownOpen(false);
                  }} 
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;