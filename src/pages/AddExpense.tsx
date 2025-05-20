import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Calendar, DollarSign, Tag, ChevronLeft, Users } from 'lucide-react';
import { useGroup } from '../hooks/useGroup';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../config/constants';
import { format } from 'date-fns';

interface SplitItem {
  userId: string;
  name: string;
  amount: number;
  percentage: number;
}

interface GroupMember {
  _id: string;
  name: string;
}

const categories = [
  'Food & Drink',
  'Groceries',
  'Housing',
  'Transportation',
  'Utilities',
  'Entertainment',
  'Travel',
  'Shopping',
  'Health',
  'Other'
];

const AddExpense: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { groups, addExpense } = useGroup();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [category, setCategory] = useState('Other');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(groupId || null);
  const [splitMethod, setSplitMethod] = useState<'equal' | 'exact' | 'percentage'>('equal');
  const [splits, setSplits] = useState<SplitItem[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Fetch group members when group is selected
  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (!selectedGroup) {
        setSplits([]);
        return;
      }
      
      try {
        const res = await axios.get(`${API_URL}/api/groups/${selectedGroup}/members`);
        setGroupMembers(res.data);
        
        // Initialize splits with equal distribution
        const numMembers = res.data.length;
        const splitAmount = numMembers > 0 ? 100 / numMembers : 0;
        
        const initialSplits = res.data.map((member: GroupMember) => ({
          userId: member._id,
          name: member.name,
          amount: 0, // Will be calculated when amount changes
          percentage: splitAmount
        }));
        
        setSplits(initialSplits);
      } catch (error) {
        console.error('Error fetching group members:', error);
        toast.error('Failed to load group members');
      }
    };
    
    fetchGroupMembers();
  }, [selectedGroup]);
  
  // Update split amounts when total amount changes
  useEffect(() => {
    if (splitMethod === 'equal' && splits.length > 0 && amount) {
      const totalAmount = parseFloat(amount);
      const splitAmount = totalAmount / splits.length;
      
      setSplits(splits.map(split => ({
        ...split,
        amount: parseFloat(splitAmount.toFixed(2))
      })));
    } else if (splitMethod === 'percentage' && splits.length > 0 && amount) {
      const totalAmount = parseFloat(amount);
      
      setSplits(splits.map(split => ({
        ...split,
        amount: parseFloat(((split.percentage / 100) * totalAmount).toFixed(2))
      })));
    }
  }, [amount, splitMethod, splits.length]);
  
  // Handle split method change
  const handleSplitMethodChange = (method: 'equal' | 'exact' | 'percentage') => {
    setSplitMethod(method);
    
    if (method === 'equal' && amount) {
      const totalAmount = parseFloat(amount);
      const splitAmount = totalAmount / splits.length;
      
      setSplits(splits.map(split => ({
        ...split,
        amount: parseFloat(splitAmount.toFixed(2)),
        percentage: 100 / splits.length
      })));
    } else if (method === 'percentage') {
      const equalPercentage = 100 / splits.length;
      
      setSplits(splits.map(split => ({
        ...split,
        percentage: equalPercentage,
        amount: amount ? parseFloat(((equalPercentage / 100) * parseFloat(amount)).toFixed(2)) : 0
      })));
    }
  };
  
  // Handle exact amount change for a specific user
  const handleExactAmountChange = (userId: string, newAmount: string) => {
    const parsedAmount = parseFloat(newAmount) || 0;
    
    setSplits(splits.map(split => 
      split.userId === userId ? { ...split, amount: parsedAmount } : split
    ));
  };
  
  // Handle percentage change for a specific user
  const handlePercentageChange = (userId: string, newPercentage: string) => {
    const parsedPercentage = parseFloat(newPercentage) || 0;
    const totalAmount = amount ? parseFloat(amount) : 0;
    
    setSplits(splits.map(split => 
      split.userId === userId 
        ? { 
            ...split, 
            percentage: parsedPercentage,
            amount: parseFloat(((parsedPercentage / 100) * totalAmount).toFixed(2))
          } 
        : split
    ));
  };
  
  // Validate totals for exact split
  const validateExactSplit = () => {
    const totalAmount = parseFloat(amount);
    const splitSum = splits.reduce((sum, split) => sum + split.amount, 0);
    
    return Math.abs(totalAmount - splitSum) < 0.01; // Allow for small rounding errors
  };
  
  // Validate totals for percentage split
  const validatePercentageSplit = () => {
    const percentageSum = splits.reduce((sum, split) => sum + split.percentage, 0);
    return Math.abs(100 - percentageSum) < 0.01; // Allow for small rounding errors
  };
  
  // Handle expense submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (!selectedGroup) {
      toast.error('Please select a group');
      return;
    }
    
    if (splitMethod === 'exact' && !validateExactSplit()) {
      toast.error('The sum of split amounts must equal the total amount');
      return;
    }
    
    if (splitMethod === 'percentage' && !validatePercentageSplit()) {
      toast.error('The sum of percentages must equal 100%');
      return;
    }
    
    setLoading(true);
    
    try {
      const expenseData = {
        description,
        amount: parseFloat(amount),
        group: selectedGroup,
        payer: user?.id,
        category,
        date,
        splits: splits.map(split => ({
          user: split.userId,
          amount: split.amount
        }))
      };
      
      await addExpense(expenseData);
      
      toast.success('Expense added successfully!');
      
      // Navigate back to group page or dashboard
      if (groupId) {
        navigate(`/groups/${groupId}`);
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to add expense';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <Link
          to={groupId ? `/groups/${groupId}` : '/dashboard'}
          className="mr-2 text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Add an expense</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          {/* Description */}
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this expense for?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          
          {/* Amount */}
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
          </div>
          
          {/* Date */}
          <div className="mb-4">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          {/* Category */}
          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Group selection - Only shown if not already in a group context */}
          {!groupId && (
            <div className="mb-4">
              <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">
                Group
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="group"
                  value={selectedGroup || ''}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Select a group</option>
                  {groups.map(group => (
                    <option key={group._id} value={group._id}>{group.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          {/* Split options */}
          {selectedGroup && splits.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Split details</h3>
              
              {/* Split method selection */}
              <div className="flex space-x-4 mb-4">
                <button
                  type="button"
                  onClick={() => handleSplitMethodChange('equal')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    splitMethod === 'equal'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Equal
                </button>
                <button
                  type="button"
                  onClick={() => handleSplitMethodChange('exact')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    splitMethod === 'exact'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Exact amounts
                </button>
                <button
                  type="button"
                  onClick={() => handleSplitMethodChange('percentage')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    splitMethod === 'percentage'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Percentages
                </button>
              </div>
              
              {/* Split list */}
              <div className="space-y-3 mt-4">
                {splits.map(split => (
                  <div key={split.userId} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm">
                        {split.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-800">
                        {split.userId === user?.id ? `${split.name} (You)` : split.name}
                      </span>
                    </div>
                    
                    {splitMethod === 'equal' && (
                      <div className="text-sm font-medium text-gray-800">
                        ${split.amount.toFixed(2)}
                      </div>
                    )}
                    
                    {splitMethod === 'exact' && (
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          value={split.amount}
                          onChange={(e) => handleExactAmountChange(split.userId, e.target.value)}
                          className="w-24 pl-7 pr-3 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    )}
                    
                    {splitMethod === 'percentage' && (
                      <div className="relative rounded-md shadow-sm">
                        <input
                          type="number"
                          value={split.percentage}
                          onChange={(e) => handlePercentageChange(split.userId, e.target.value)}
                          className="w-20 pr-8 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-right"
                          step="0.1"
                          min="0"
                          max="100"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">%</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Split summary */}
              {splitMethod !== 'equal' && (
                <div className="mt-4 bg-gray-100 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      {splitMethod === 'exact' ? 'Total split amount:' : 'Total percentage:'}
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {splitMethod === 'exact' 
                        ? `$${splits.reduce((sum, split) => sum + split.amount, 0).toFixed(2)}` 
                        : `${splits.reduce((sum, split) => sum + split.percentage, 0).toFixed(1)}%`}
                    </span>
                  </div>
                  {splitMethod === 'exact' && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm font-medium text-gray-700">Total expense:</span>
                      <span className="text-sm font-medium text-gray-800">${amount}</span>
                    </div>
                  )}
                  {(splitMethod === 'exact' && !validateExactSplit() && amount) && (
                    <p className="text-xs text-error mt-1">
                      The split amounts don't add up to the total
                    </p>
                  )}
                  {(splitMethod === 'percentage' && !validatePercentageSplit()) && (
                    <p className="text-xs text-error mt-1">
                      Percentages must add up to 100%
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Submit button */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Save expense'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;