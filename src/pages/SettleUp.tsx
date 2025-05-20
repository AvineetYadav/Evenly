import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, DollarSign, User, ArrowRight } from 'lucide-react';
import { useGroup } from '../hooks/useGroup';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../config/constants';

interface UserBalance {
  userId: string;
  name: string;
  amount: number;
}

interface SettlementDetail {
  payer: string;
  payerName: string;
  receiver: string;
  receiverName: string;
  amount: number;
}

const SettleUp: React.FC = () => {
  const { user } = useAuth();
  const { groups, settleDebt } = useGroup();
  const [searchParams] = useSearchParams();
  const groupIdParam = searchParams.get('group');
  
  const [selectedGroup, setSelectedGroup] = useState<string | null>(groupIdParam);
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [settlements, setSettlements] = useState<SettlementDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementDetail | null>(null);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [isSettling, setIsSettling] = useState(false);
  
  // Fetch balances when group selection changes
  useEffect(() => {
    const fetchBalances = async () => {
      setLoading(true);
      try {
        let endpoint = `${API_URL}/api/balances`;
        if (selectedGroup) {
          endpoint += `?group=${selectedGroup}`;
        }
        
        const res = await axios.get(endpoint);
        setBalances(res.data);
        
        // Also fetch suggested settlements
        const settlementsRes = await axios.get(`${API_URL}/api/settlements/suggestions${selectedGroup ? `?group=${selectedGroup}` : ''}`);
        setSettlements(settlementsRes.data);
      } catch (error) {
        console.error('Error fetching balances:', error);
        toast.error('Failed to load balances');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBalances();
  }, [selectedGroup]);
  
  // Open settlement modal with pre-populated data
  const openSettleModal = (settlement: SettlementDetail) => {
    setSelectedSettlement(settlement);
    setSettlementAmount(settlement.amount.toFixed(2));
    setShowSettleModal(true);
  };
  
  // Handle settlement form submission
  const handleSettleDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSettlement) return;
    
    if (!settlementAmount || parseFloat(settlementAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setIsSettling(true);
    
    try {
      await settleDebt(
        selectedSettlement.payer,
        selectedSettlement.receiver,
        parseFloat(settlementAmount),
        selectedGroup || undefined
      );
      
      toast.success('Payment recorded successfully!');
      setShowSettleModal(false);
      
      // Refresh balances and settlements
      const endpoint = `${API_URL}/api/balances${selectedGroup ? `?group=${selectedGroup}` : ''}`;
      const res = await axios.get(endpoint);
      setBalances(res.data);
      
      const settlementsRes = await axios.get(`${API_URL}/api/settlements/suggestions${selectedGroup ? `?group=${selectedGroup}` : ''}`);
      setSettlements(settlementsRes.data);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to record payment';
      toast.error(message);
    } finally {
      setIsSettling(false);
    }
  };
  
  return (
    <div>
      <div className="flex items-center mb-6">
        <Link
          to="/dashboard"
          className="mr-2 text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Settle Balances</h1>
      </div>
      
      {/* Group filter */}
      <div className="bg-white rounded-lg shadow-card p-4 mb-6">
        <label htmlFor="groupFilter" className="block text-sm font-medium text-gray-700 mb-2">
          Filter by group
        </label>
        <select
          id="groupFilter"
          value={selectedGroup || ''}
          onChange={(e) => setSelectedGroup(e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All balances</option>
          {groups.map(group => (
            <option key={group._id} value={group._id}>{group.name}</option>
          ))}
        </select>
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - User balances */}
        <div>
          <h2 className="text-lg font-medium text-gray-800 mb-3">Your balances</h2>
          
          {loading ? (
            <div className="bg-white rounded-lg shadow-card p-8 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
              <p className="mt-3 text-sm text-gray-500">Loading balances...</p>
            </div>
          ) : balances.length > 0 ? (
            <div className="space-y-3">
              {balances.map((balance) => (
                <div 
                  key={balance.userId} 
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
                        {balance.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <p className="text-md font-medium text-gray-800">{balance.name}</p>
                      </div>
                    </div>
                    
                    <div className={`text-right ${
                      balance.amount > 0 ? 'text-success' : balance.amount < 0 ? 'text-error' : 'text-gray-600'
                    }`}>
                      <p className="text-lg font-bold">
                        {balance.amount > 0 
                          ? `owes you $${Math.abs(balance.amount).toFixed(2)}` 
                          : balance.amount < 0 
                          ? `you owe $${Math.abs(balance.amount).toFixed(2)}`
                          : 'settled up'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-card p-8 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                <DollarSign className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No balances to settle</h3>
              <p className="mt-2 text-sm text-gray-500">
                {selectedGroup
                  ? "Everyone in this group is settled up!"
                  : "You're all settled up with everyone!"}
              </p>
            </div>
          )}
        </div>
        
        {/* Right column - Suggested settlements */}
        <div>
          <h2 className="text-lg font-medium text-gray-800 mb-3">Suggested settlements</h2>
          
          {loading ? (
            <div className="bg-white rounded-lg shadow-card p-8 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
              <p className="mt-3 text-sm text-gray-500">Loading suggestions...</p>
            </div>
          ) : settlements.length > 0 ? (
            <div className="space-y-3">
              {settlements.map((settlement, index) => (
                <div key={index} className="bg-white rounded-lg shadow-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium">
                        {settlement.payerName.charAt(0).toUpperCase()}
                      </div>
                      <ArrowRight className="h-5 w-5 mx-2 text-gray-400" />
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium">
                        {settlement.receiverName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-800">${settlement.amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {settlement.payer === user?.id 
                          ? 'You pay' 
                          : settlement.receiver === user?.id 
                          ? 'You receive' 
                          : `${settlement.payerName} pays`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-sm">
                    <p>
                      <span className="font-medium">
                        {settlement.payer === user?.id ? 'You' : settlement.payerName}
                      </span> 
                      {' '}pay{settlement.payer === user?.id ? '' : 's'}{' '}
                      <span className="font-medium">
                        {settlement.receiver === user?.id ? 'you' : settlement.receiverName}
                      </span>
                    </p>
                  </div>
                  
                  <button
                    onClick={() => openSettleModal(settlement)}
                    className={`mt-3 w-full py-2 px-4 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      settlement.payer === user?.id
                        ? 'bg-primary-500 hover:bg-primary-600 text-white border-transparent focus:ring-primary-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-gray-500'
                    }`}
                  >
                    {settlement.payer === user?.id ? 'Record payment' : 'View details'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-card p-8 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                <DollarSign className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No settlement suggestions</h3>
              <p className="mt-2 text-sm text-gray-500">
                {selectedGroup
                  ? "There are no suggested settlements for this group"
                  : "There are no suggested settlements at this time"}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Settlement modal */}
      {showSettleModal && selectedSettlement && (
        <div className="fixed z-20 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="mt-3 text-center sm:mt-0 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Record a payment
                </h3>
                
                <div className="mt-4">
                  <div className="flex items-center justify-center py-4 border-b border-t border-gray-200 my-4">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium text-lg">
                        {selectedSettlement.payerName.charAt(0).toUpperCase()}
                      </div>
                      <ArrowRight className="h-6 w-6 mx-3 text-gray-400" />
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium text-lg">
                        {selectedSettlement.receiverName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>
                  
                  <form onSubmit={handleSettleDebt}>
                    <div>
                      <label htmlFor="settlementAmount" className="block text-sm font-medium text-gray-700 mb-1">
                        Payment amount
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          id="settlementAmount"
                          value={settlementAmount}
                          onChange={(e) => setSettlementAmount(e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          max={selectedSettlement.amount}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Suggested amount: ${selectedSettlement.amount.toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                      <button
                        type="submit"
                        disabled={isSettling}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-500 text-base font-medium text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSettling ? 'Processing...' : 'Record payment'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSettleModal(false)}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettleUp;