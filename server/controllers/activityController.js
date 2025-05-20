import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';
import Group from '../models/Group.js';
import User from '../models/User.js';

// @desc    Get recent activity
// @route   GET /api/activity/recent
// @access  Private
export const getRecentActivity = async (req, res) => {
  try {
    // Get groups the user is a member of
    const groups = await Group.find({ members: req.user._id });
    const groupIds = groups.map(group => group._id);
    
    // Get recent expenses
    const expenses = await Expense.find({
      group: { $in: groupIds },
      $or: [
        { payer: req.user._id },
        { 'splits.user': req.user._id }
      ]
    })
    .sort({ date: -1, createdAt: -1 })
    .limit(5)
    .populate('payer', 'name')
    .populate('group', 'name');
    
    // Get recent settlements
    const settlements = await Settlement.find({
      $or: [
        { payer: req.user._id },
        { receiver: req.user._id }
      ],
      group: { $in: groupIds }
    })
    .sort({ date: -1, createdAt: -1 })
    .limit(5)
    .populate('payer', 'name')
    .populate('receiver', 'name')
    .populate('group', 'name');
    
    // Format expenses
    const formattedExpenses = expenses.map(expense => ({
      _id: expense._id,
      type: 'expense',
      description: expense.description,
      amount: expense.amount,
      date: expense.date,
      group: expense.group ? {
        _id: expense.group._id,
        name: expense.group.name
      } : undefined,
      payer: {
        _id: expense.payer._id,
        name: expense.payer.name
      }
    }));
    
    // Format settlements
    const formattedSettlements = settlements.map(settlement => ({
      _id: settlement._id,
      type: 'payment',
      description: `${settlement.payer.name} paid ${settlement.receiver.name}`,
      amount: settlement.amount,
      date: settlement.date,
      group: settlement.group ? {
        _id: settlement.group._id,
        name: settlement.group.name
      } : undefined,
      payer: {
        _id: settlement.payer._id,
        name: settlement.payer.name
      },
      payee: {
        _id: settlement.receiver._id,
        name: settlement.receiver.name
      }
    }));
    
    // Combine and sort by date
    const activity = [...formattedExpenses, ...formattedSettlements]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
    
    res.json(activity);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all activity
// @route   GET /api/activity
// @access  Private
export const getAllActivity = async (req, res) => {
  try {
    // Get groups the user is a member of
    const groups = await Group.find({ members: req.user._id });
    const groupIds = groups.map(group => group._id);
    
    // Get all expenses
    const expenses = await Expense.find({
      group: { $in: groupIds },
      $or: [
        { payer: req.user._id },
        { 'splits.user': req.user._id }
      ]
    })
    .sort({ date: -1, createdAt: -1 })
    .populate('payer', 'name')
    .populate('group', 'name');
    
    // Get all settlements
    const settlements = await Settlement.find({
      $or: [
        { payer: req.user._id },
        { receiver: req.user._id }
      ],
      group: { $in: groupIds }
    })
    .sort({ date: -1, createdAt: -1 })
    .populate('payer', 'name')
    .populate('receiver', 'name')
    .populate('group', 'name');
    
    // Format expenses
    const formattedExpenses = expenses.map(expense => ({
      _id: expense._id,
      type: 'expense',
      description: expense.description,
      amount: expense.amount,
      date: expense.date,
      group: expense.group ? {
        _id: expense.group._id,
        name: expense.group.name
      } : undefined,
      payer: {
        _id: expense.payer._id,
        name: expense.payer.name
      }
    }));
    
    // Format settlements
    const formattedSettlements = settlements.map(settlement => ({
      _id: settlement._id,
      type: 'payment',
      description: `${settlement.payer.name} paid ${settlement.receiver.name}`,
      amount: settlement.amount,
      date: settlement.date,
      group: settlement.group ? {
        _id: settlement.group._id,
        name: settlement.group.name
      } : undefined,
      payer: {
        _id: settlement.payer._id,
        name: settlement.payer.name
      },
      payee: {
        _id: settlement.receiver._id,
        name: settlement.receiver.name
      }
    }));
    
    // Combine and sort by date
    const activity = [...formattedExpenses, ...formattedSettlements]
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json(activity);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};