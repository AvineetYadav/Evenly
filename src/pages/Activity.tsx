import React, { useEffect, useState } from 'react';
import { Calendar, DollarSign, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/constants';
import { format, parseISO } from 'date-fns';

interface ActivityItem {
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

const Activity: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'expenses' | 'payments'>('all');

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/activity`);
        setActivities(res.data);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Group activities by date
  const groupedActivities: Record<string, ActivityItem[]> = {};
  const filteredActivities = activities.filter(activity => 
    filter === 'all' || activity.type === filter
  );

  filteredActivities.forEach(activity => {
    const date = format(parseISO(activity.date), 'yyyy-MM-dd');
    if (!groupedActivities[date]) {
      groupedActivities[date] = [];
    }
    groupedActivities[date].push(activity);
  });

  const dateKeys = Object.keys(groupedActivities).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Recent Activity</h1>
      
      {/* Filters */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('expenses')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === 'expenses'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Expenses
        </button>
        <button
          onClick={() => setFilter('payments')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === 'payments'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Payments
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : dateKeys.length > 0 ? (
        <div className="space-y-6">
          {dateKeys.map(dateKey => (
            <div key={dateKey}>
              <div className="flex items-center mb-3">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-md font-medium text-gray-700">
                  {format(parseISO(dateKey), 'EEEE, MMMM d, yyyy')}
                </h2>
              </div>
              
              <div className="space-y-3">
                {groupedActivities[dateKey].map(activity => (
                  <div 
                    key={activity._id} 
                    className="bg-white rounded-lg shadow-card overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                            activity.type === 'expense' 
                              ? 'bg-primary-100 text-primary-600' 
                              : 'bg-success bg-opacity-10 text-success'
                          }`}>
                            {activity.type === 'expense' ? (
                              <DollarSign className="h-6 w-6" />
                            ) : (
                              <span className="text-xl">→</span>
                            )}
                          </div>
                          
                          <div className="ml-3">
                            <p className="text-md font-medium text-gray-800">{activity.description}</p>
                            <div className="flex mt-1 text-xs text-gray-500">
                              <span className="flex items-center">
                                {format(parseISO(activity.date), 'h:mm a')}
                              </span>
                              
                              {activity.group && (
                                <Link
                                  to={`/groups/${activity.group._id}`}
                                  className="flex items-center ml-3 text-primary-600 hover:text-primary-700"
                                >
                                  <Users className="h-3 w-3 mr-1" />
                                  {activity.group.name}
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className={`text-md font-bold ${
                            activity.type === 'payment' ? 'text-success' : 'text-gray-900'
                          }`}>
                            ${activity.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {activity.type === 'expense' 
                              ? `Added by ${activity.payer.name}` 
                              : `${activity.payer.name} paid ${activity.payee?.name || 'someone'}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-card p-8 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
            <Calendar className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No activity found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {filter === 'all' 
              ? "You don't have any activity yet."
              : filter === 'expenses'
              ? "You don't have any expenses yet."
              : "You don't have any payments yet."}
          </p>
          <Link
            to="/expenses/new"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Add your first expense
          </Link>
        </div>
      )}
    </div>
  );
};

export default Activity;