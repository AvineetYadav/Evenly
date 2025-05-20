import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Activity, DollarSign, PlusCircle } from 'lucide-react';
import { useGroup } from '../../hooks/useGroup';

const Sidebar: React.FC = () => {
  const { groups } = useGroup();
  
  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center px-4 py-2.5 text-sm font-medium rounded-md ${
      isActive 
        ? 'bg-primary-50 text-primary-700' 
        : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <div className="h-full flex flex-col p-4">
      <div className="space-y-1">
        <NavLink to="/dashboard" className={navLinkClass}>
          <Home className="h-5 w-5 mr-3" />
          Dashboard
        </NavLink>
        
        <NavLink to="/activity" className={navLinkClass}>
          <Activity className="h-5 w-5 mr-3" />
          Recent Activity
        </NavLink>
        
        <NavLink to="/groups" className={navLinkClass}>
          <Users className="h-5 w-5 mr-3" />
          All Groups
        </NavLink>
        
        <NavLink to="/settle" className={navLinkClass}>
          <DollarSign className="h-5 w-5 mr-3" />
          Settle Up
        </NavLink>
      </div>
      
      <div className="mt-6">
        <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Your Groups
        </h3>
        
        <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
          {groups.length > 0 ? (
            groups.map((group) => (
              <NavLink 
                key={group._id} 
                to={`/groups/${group._id}`}
                className={navLinkClass}
              >
                <div className="w-5 h-5 mr-3 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-700 text-xs font-medium">
                  {group.name[0].toUpperCase()}
                </div>
                <span className="truncate">{group.name}</span>
              </NavLink>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">
              No groups yet
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-auto">
        <NavLink 
          to="/expenses/new" 
          className="flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Add an expense
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;