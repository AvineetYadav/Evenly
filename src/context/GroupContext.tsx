import React, { createContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { API_URL } from '../config/constants';

interface Group {
  _id: string;
  name: string;
  members: string[];
  creator: string;
  createdAt: string;
}

interface Expense {
  _id: string;
  description: string;
  amount: number;
  payer: string;
  group: string;
  splits: {
    user: string;
    amount: number;
  }[];
  date: string;
  category: string;
}

interface Balance {
  user: string;
  amount: number;
}

interface GroupContextType {
  groups: Group[];
  currentGroup: Group | null;
  expenses: Expense[];
  balances: Record<string, Balance[]>;
  loading: boolean;
  fetchGroups: () => Promise<void>;
  fetchGroupDetails: (groupId: string) => Promise<void>;
  createGroup: (name: string, members: string[]) => Promise<void>;
  addExpense: (expenseData: Omit<Expense, '_id'>) => Promise<void>;
  settleDebt: (payerId: string, receiverId: string, amount: number, groupId?: string) => Promise<void>;
}

export const GroupContext = createContext<GroupContextType>({
  groups: [],
  currentGroup: null,
  expenses: [],
  balances: {},
  loading: false,
  fetchGroups: async () => {},
  fetchGroupDetails: async () => {},
  createGroup: async () => {},
  addExpense: async () => {},
  settleDebt: async () => {},
});

interface GroupProviderProps {
  children: ReactNode;
}

export const GroupProvider: React.FC<GroupProviderProps> = ({ children }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Record<string, Balance[]>>({});
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchGroups = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/groups`);
      setGroups(res.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupDetails = async (groupId: string) => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const groupRes = await axios.get(`${API_URL}/api/groups/${groupId}`);
      setCurrentGroup(groupRes.data);

      const expensesRes = await axios.get(`${API_URL}/api/expenses?group=${groupId}`);
      setExpenses(expensesRes.data);

      const balanceRes = await axios.get(`${API_URL}/api/balances?group=${groupId}`);
      setBalances((prev) => ({ ...prev, [groupId]: balanceRes.data }));
    } catch (error) {
      console.error('Error fetching group details:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (name: string, members: string[]) => {
    try {
      const res = await axios.post(`${API_URL}/api/groups`, { name, members });
      setGroups((prev) => [res.data, ...prev]);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const addExpense = async (expenseData: Omit<Expense, '_id'>) => {
    try {
      const res = await axios.post(`${API_URL}/api/expenses`, expenseData);
      setExpenses((prev) => [...prev, res.data]);
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const settleDebt = async (payerId: string, receiverId: string, amount: number, groupId?: string) => {
    try {
      await axios.post(`${API_URL}/api/settlements`, {
        payerId,
        receiverId,
        amount,
        groupId,
      });
      if (groupId) await fetchGroupDetails(groupId);
    } catch (error) {
      console.error('Error settling debt:', error);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [isAuthenticated]);

  return (
    <GroupContext.Provider
      value={{
        groups,
        currentGroup,
        expenses,
        balances,
        loading,
        fetchGroups,
        fetchGroupDetails,
        createGroup,
        addExpense,
        settleDebt,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};
