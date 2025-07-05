import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, DollarSign, ArrowRight } from 'lucide-react';
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

  // Fetch balances and suggested settlements
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const balanceUrl = `${API_URL}/api/balances${selectedGroup ? `?group=${selectedGroup}` : ''}`;
        const settlementUrl = `${API_URL}/api/settlements/suggestions${selectedGroup ? `?group=${selectedGroup}` : ''}`;

        const [balancesRes, settlementsRes] = await Promise.all([
          axios.get(balanceUrl),
          axios.get(settlementUrl),
        ]);

        setBalances(balancesRes.data);
        setSettlements(settlementsRes.data);
      } catch (err) {
        toast.error('Error fetching balances or settlements');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedGroup]);

  const openSettleModal = (settlement: SettlementDetail) => {
    setSelectedSettlement(settlement);
    setSettlementAmount(settlement.amount.toFixed(2));
    setShowSettleModal(true);
  };

  const handleSettleDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSettlement) return;

    const amount = parseFloat(settlementAmount);
    if (!amount || amount <= 0 || amount > selectedSettlement.amount) {
      toast.error('Enter a valid amount');
      return;
    }

    setIsSettling(true);
    try {
      await settleDebt(
        selectedSettlement.payer,
        selectedSettlement.receiver,
        amount,
        selectedGroup || undefined
      );

      toast.success('Payment recorded successfully!');
      setShowSettleModal(false);

      const res = await axios.get(`${API_URL}/api/balances${selectedGroup ? `?group=${selectedGroup}` : ''}`);
      const settlementsRes = await axios.get(`${API_URL}/api/settlements/suggestions${selectedGroup ? `?group=${selectedGroup}` : ''}`);

      setBalances(res.data);
      setSettlements(settlementsRes.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <Link to="/dashboard" className="mr-2 text-gray-500 hover:text-gray-700">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Settle Balances</h1>
      </div>

      {/* Group Filter */}
      <div className="bg-white rounded-lg shadow-card p-4 mb-6">
        <label htmlFor="groupFilter" className="block text-sm font-medium text-gray-700 mb-2">
          Filter by group
        </label>
        <select
          id="groupFilter"
          value={selectedGroup || ''}
          onChange={(e) => setSelectedGroup(e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All balances</option>
          {groups.map((group) => (
            <option key={group._id} value={group._id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balances */}
        <div>
          <h2 className="text-lg font-medium text-gray-800 mb-3">Your balances</h2>
          {loading ? (
            <p>Loading...</p>
          ) : balances.length > 0 ? (
            <div className="space-y-3">
              {balances.map((b) => (
                <div
                  key={b.userId}
                  className={`p-4 border rounded-lg ${
                    b.amount > 0
                      ? 'border-green-500 bg-green-50'
                      : b.amount < 0
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{b.name}</p>
                    <p>
                      {b.amount > 0
                        ? `Owes you $${b.amount.toFixed(2)}`
                        : b.amount < 0
                        ? `You owe $${Math.abs(b.amount).toFixed(2)}`
                        : 'Settled'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No balances to show</p>
          )}
        </div>

        {/* Settlements */}
        <div>
          <h2 className="text-lg font-medium text-gray-800 mb-3">Suggested settlements</h2>
          {loading ? (
            <p>Loading...</p>
          ) : settlements.length > 0 ? (
            <div className="space-y-3">
              {settlements.map((s, idx) => (
                <div key={idx} className="p-4 border rounded-lg bg-white shadow-card">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="font-medium">{s.payerName}</span>
                      <ArrowRight className="mx-2 w-4 h-4 text-gray-500" />
                      <span className="font-medium">{s.receiverName}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${s.amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {s.payer === user?.id
                          ? 'You pay'
                          : s.receiver === user?.id
                          ? 'You receive'
                          : `${s.payerName} pays`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => openSettleModal(s)}
                    className={`mt-3 w-full px-4 py-2 rounded-md text-sm font-medium ${
                      s.payer === user?.id
                        ? 'bg-primary-500 text-white hover:bg-primary-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {s.payer === user?.id ? 'Record payment' : 'View details'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>No suggested settlements.</p>
          )}
        </div>
      </div>

      {/* Settlement Modal */}
      {showSettleModal && selectedSettlement && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-medium mb-4">Record a payment</h3>
            <form onSubmit={handleSettleDebt}>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount to settle
              </label>
              <input
                id="amount"
                type="number"
                className="w-full px-3 py-2 border rounded-md"
                value={settlementAmount}
                onChange={(e) => setSettlementAmount(e.target.value)}
                min="0"
                max={selectedSettlement.amount}
                step="0.01"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Suggested: ${selectedSettlement.amount.toFixed(2)}
              </p>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSettling}
                  className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50"
                >
                  {isSettling ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettleUp;
