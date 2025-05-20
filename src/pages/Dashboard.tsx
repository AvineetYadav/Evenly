import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useGroup } from '../hooks/useGroup';
import axios from 'axios';
import { API_URL } from '../config/constants';
import { format } from 'date-fns';

interface Balance {
  userId: string;
  name: string;
  amount: number;
}

interface TotalBalance {
  youOwe: number;
  youAreOwed: number;
  net: number;
}

interface RecentActivity {
  _id: string;
  type: 'expense' | 'payment';
  description: string;
  amount: number;
  date: string;
  group?: {
    _id: string;
    name: string;
  };
  payer: {
    _id: string;
    name: string;
  };
  payee?: {
    _id: string;
    name: string;
  };
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { groups } = useGroup();
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [totalBalance, setTotalBalance] = useState<TotalBalance>({
    youOwe: 0,
    youAreOwed: 0,
    net: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch user balances
        const balancesRes = await axios.get(`${API_URL}/api/balances/summary`);
        setBalances(balancesRes.data.balances);
        setTotalBalance({
          youOwe: balancesRes.data.youOwe,
          youAreOwed: balancesRes.data.youAreOwed,
          net: balancesRes.data.net
        });
        
        // Fetch recent activity
        const activityRes = await axios.get(`${API_URL}/api/activity/recent`);
        setRecentActivity(activityRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="pb-16 md:pb-0">
      {/* Total balance overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className={`bg-white p-4 rounded-lg shadow-card ${totalBalance.net >= 0 ? 'border-l-4 border-success' : 'border-l-4 border-error'}`}>
          <h3 className="text-sm font-medium text-gray-500">Total balance</h3>
          <p className={`text-2xl font-bold ${totalBalance.net >= 0 ? 'text-success' : 'text-error'}`}>
            ${Math.abs(totalBalance.net).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {totalBalance.net >= 0 ? 'you are owed' : 'you owe'}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-card border-l-4 border-error">
          <h3 className="text-sm font-medium text-gray-500">You owe</h3>
          <p className="text-2xl font-bold text-error">${totalBalance.youOwe.toFixed(2)}</p>
          <Link to="/settle" className="text-sm text-primary-600 hover:text-primary-700 mt-1 inline-block">
            View details →
          </Link>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-card border-l-4 border-success">
          <h3 className="text-sm font-medium text-gray-500">You are owed</h3>
          <p className="text-2xl font-bold text-success">${totalBalance.youAreOwed.toFixed(2)}</p>
          <Link to="/settle" className="text-sm text-primary-600 hover:text-primary-700 mt-1 inline-block">
            View details →
          </Link>
        </div>
      </div>
      
      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Balances */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-card overflow-hidden">
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-lg font-medium text-gray-800">Your Balances</h2>
              <Link 
                to="/settle" 
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
              >
                <span>Settle up</span>
              </Link>
            </div>
            
            {balances.length > 0 ? (
              <div className="divide-y">
                {balances.map((balance) => (
                  <div 
                    key={balance.userId} 
                    className="flex justify-between items-center p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium">
                        {balance.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-800">{balance.name}</p>
                      </div>
                    </div>
                    
                    {balance.amount !== 0 && (
                      <div className={`flex items-center ${balance.amount > 0 ? 'text-success' : 'text-error'}`}>
                        {balance.amount > 0 ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        <span className="text-sm font-medium">
                          {balance.amount > 0 
                            ? `owes you $${Math.abs(balance.amount).toFixed(2)}` 
                            : `you owe $${Math.abs(balance.amount).toFixed(2)}`}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">No balances to display</p>
                <Link
                  to="/expenses/new"
                  className="mt-3 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add your first expense
                </Link>
              </div>
            )}
          </div>
          
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-card overflow-hidden mt-6">
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-lg font-medium text-gray-800">Recent Activity</h2>
              <Link 
                to="/activity" 
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View all
              </Link>
            </div>
            
            {recentActivity.length > 0 ? (
              <div className="divide-y">
                {recentActivity.map((activity) => (
                  <div 
                    key={activity._id} 
                    className="p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          activity.type === 'expense' ? 'bg-primary-100 text-primary-600' : 'bg-success text-white'
                        }`}>
                          {activity.type === 'expense' ? '$' : '→'}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-800">{activity.description}</p>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <span>{format(new Date(activity.date), 'MMM d, yyyy')}</span>
                            {activity.group && (
                              <>
                                <span className="mx-1">•</span>
                                <Link 
                                  to={`/groups/${activity.group._id}`}
                                  className="flex items-center text-primary-600 hover:text-primary-700"
                                >
                                  <Users className="h-3 w-3 mr-1" />
                                  {activity.group.name}
                                </Link>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm font-medium">
                        {activity.type === 'expense' ? (
                          <span>${activity.amount.toFixed(2)}</span>
                        ) : (
                          <span className="text-success">${activity.amount.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Right column - Groups */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-card overflow-hidden">
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-lg font-medium text-gray-800">Your Groups</h2>
              <Link 
                to="/groups" 
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                See all
              </Link>
            </div>
            
            {groups.length > 0 ? (
              <div className="divide-y">
                {groups.slice(0, 5).map((group) => (
                  <Link 
                    key={group._id} 
                    to={`/groups/${group._id}`}
                    className="flex items-center p-4 hover:bg-gray-50"
                  >
                    <div className="h-10 w-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-700 font-medium">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-800">{group.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">You haven't created any groups yet</p>
                <Link
                  to="/groups"
                  className="mt-3 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create your first group
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;