import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Plus, Activity, User } from 'lucide-react';

const MobileNavbar: React.FC = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `flex flex-col items-center justify-center text-xs font-medium ${
      isActive ? 'text-primary-600' : 'text-gray-600'
    }`;
    
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 px-4 z-10">
      <NavLink to="/dashboard" className={navLinkClass}>
        <Home className="h-6 w-6 mb-1" />
        <span>Home</span>
      </NavLink>
      
      <NavLink to="/groups" className={navLinkClass}>
        <Users className="h-6 w-6 mb-1" />
        <span>Groups</span>
      </NavLink>
      
      <NavLink to="/expenses/new" className="relative -top-5">
        <div className="bg-primary-500 text-white p-3 rounded-full shadow-lg">
          <Plus className="h-6 w-6" />
        </div>
      </NavLink>
      
      <NavLink to="/activity" className={navLinkClass}>
        <Activity className="h-6 w-6 mb-1" />
        <span>Activity</span>
      </NavLink>
      
      <NavLink to="/profile" className={navLinkClass}>
        <User className="h-6 w-6 mb-1" />
        <span>Profile</span>
      </NavLink>
    </div>
  );
};

export default MobileNavbar;