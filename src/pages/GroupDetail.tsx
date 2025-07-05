import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PlusCircle, ChevronLeft, BarChart4, Receipt, Users, Pencil, User } from 'lucide-react';
import { useGroup } from '../hooks/useGroup';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import { API_URL } from '../config/constants';

ChartJS.register(ArcElement, Tooltip, Legend);

interface GroupMember {
  _id: string;
  name: string;
  email: string;
}

interface ExpenseCategory {
  category: string;
  amount: number;
}

const GroupDetail: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { currentGroup, expenses, balances, fetchGroupDetails, loading } = useGroup();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'members'>('expenses');
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [expenseStats, setExpenseStats] = useState<{
    total: number;
    byCategory: ExpenseCategory[];
  }>({
    total: 0,
    byCategory: []
  });
  
  // Fetch group details when component mounts
  useEffect(() => {
    if (groupId) {
      fetchGroupDetails(groupId);
    }
  }, [groupId]);
  
  // Fetch group members and expense stats
  useEffect(() => {
    const fetchGroupData = async () => {
      if (!groupId) return;
      
      try {
        // Fetch group members
        const membersRes = await axios.get(`${API_URL}/api/groups/${groupId}/members`);
        setGroupMembers(membersRes.data);
        
        // Fetch expense statistics
        const statsRes = await axios.get(`${API_URL}/api/expenses/stats?group=${groupId}`);
        setExpenseStats(statsRes.data);
      } catch (error) {
        console.error('Error fetching group data:', error);
      }
    };
    
    fetchGroupData();
  }, [groupId, expenses]);
  
  // Chart data for expense categories
  const chartData = {
    labels: expenseStats.byCategory.map(cat => cat.category),
    datasets: [
      {
        data: expenseStats.byCategory.map(cat => cat.amount),
        backgroundColor: [
          '#1CC29F', // primary-500
          '#FF7A00', // accent-500
          '#677C99', // secondary-500
          '#4CAF50', // success
          '#FFC107', // warning
          '#F44336', // error
          '#9C27B0',
          '#3F51B5',
          '#FF5722',
        ],
        borderWidth: 0,
      },
    ],
  };
  
  // Chart options
  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
        },
      },
    },
    cutout: '70%',
  };
  
  if (loading || !currentGroup) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  const groupBalances = balances[groupId!] || [];
  
  return (
    <div className="pb-16 md:pb-0">
      {/* Group header */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Link
            to="/groups"
            className="mr-2 text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">{currentGroup.name}</h1>
          <button className="ml-2 text-gray-500 hover:text-gray-700">
            <Pencil className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Link
            to={`/expenses/new/${groupId}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusCircle className="h-5 w-5 mr-1" />
            Add expense
          </Link>
          
          <Link
            to={`/settle?group=${groupId}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Settle up
          </Link>
        </div>
      </div>
      
      {/* Group stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-card">
          <h3 className="text-sm font-medium text-gray-500">Total expenses</h3>
          <p className="text-2xl font-bold text-gray-800">${expenseStats.total.toFixed(2)}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-card">
          <h3 className="text-sm font-medium text-gray-500">Number of expenses</h3>
          <p className="text-2xl font-bold text-gray-800">{expenses.length}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-card">
          <h3 className="text-sm font-medium text-gray-500">Members</h3>
          <p className="text-2xl font-bold text-gray-800">{groupMembers.length}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-card">
          <h3 className="text-sm font-medium text-gray-500">Created on</h3>
          <p className="text-2xl font-bold text-gray-800">
            {currentGroup.createdAt 
              ? format(new Date(currentGroup.createdAt), 'MMM d, yyyy')
              : 'N/A'
            }
          </p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`w-1/3 py-4 px-4 text-center border-b-2 font-medium text-sm ${
                activeTab === 'expenses'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Receipt className="h-5 w-5 mx-auto mb-1" />
              Expenses
            </button>
            <button
              onClick={() => setActiveTab('balances')}
              className={`w-1/3 py-4 px-4 text-center border-b-2 font-medium text-sm ${
                activeTab === 'balances'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart4 className="h-5 w-5 mx-auto mb-1" />
              Balances
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`w-1/3 py-4 px-4 text-center border-b-2 font-medium text-sm ${
                activeTab === 'members'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-5 w-5 mx-auto mb-1" />
              Members
            </button>
          </nav>
        </div>
        
        {/* Tab content */}
        <div className="p-4">
          {/* Expenses tab */}
          {activeTab === 'expenses' && (
            <div>
              {expenses.length > 0 ? (
                <div>
                  {/* Expense breakdown chart */}
                  {expenseStats.byCategory.length > 0 && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Expense breakdown</h3>
                      <div className="h-64">
                        <Doughnut data={chartData} options={chartOptions} />
                      </div>
                    </div>
                  )}
                  
                  {/* Expenses list */}
                  <h3 className="text-lg font-medium text-gray-800 mb-3">All expenses</h3>
                  <div className="space-y-3">
                    {expenses.map(expense => (
                      <div key={expense._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="text-md font-medium text-gray-800">{expense.description}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {format(new Date(expense.date), 'MMM d, yyyy')}
                              {expense.category && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {expense.category}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">${expense.amount.toFixed(2)}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Paid by {expense.payer === user?.id ? 'you' : 'someone else'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <Receipt className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No expenses yet</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Get started by adding your first expense to this group.
                  </p>
                  <Link
                    to={`/expenses/new/${groupId}`}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <PlusCircle className="h-5 w-5 mr-1" />
                    Add an expense
                  </Link>
                </div>
              )}
            </div>
          )}
          
          {/* Balances tab */}
          {activeTab === 'balances' && (
            <div>
              {groupBalances.length > 0 ? (
                <div className="space-y-3">
                  {groupBalances.map(balance => (
                    <div 
                      key={balance.user} 
                      className={`bg-white border rounded-lg p-4 ${
                        balance.amount > 0 
                          ? 'border-success bg-success/5' 
                          : balance.amount < 0 
                          ? 'border-error bg-error/5'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium">
                            <User className="h-5 w-5" />
                          </div>
                          <div className="ml-3">
                            <p className="text-md font-medium text-gray-800">
                              {balance.user === user?.id ? 'You' : 'Unknown user'}
                            </p>
                          </div>
                        </div>
                        
                        <div className={`text-right ${
                          balance.amount > 0 ? 'text-success' : balance.amount < 0 ? 'text-error' : 'text-gray-600'
                        }`}>
                          <p className="text-lg font-bold">
                            {balance.amount > 0 
                              ? `gets back $${Math.abs(balance.amount).toFixed(2)}` 
                              : balance.amount < 0 
                              ? `owes $${Math.abs(balance.amount).toFixed(2)}`
                              : 'settled up'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <BarChart4 className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No balances to show</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Add expenses to see balances between group members.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Members tab */}
          {activeTab === 'members' && (
            <div>
              {groupMembers.length > 0 ? (
                <div className="space-y-3">
                  {groupMembers.map(member => (
                    <div key={member._id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <p className="text-md font-medium text-gray-800">
                            {member._id === user?.id ? `${member.name} (You)` : member.name}
                          </p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No members found</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    There seems to be an issue loading the group members.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;