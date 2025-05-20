import Expense from '../models/Expense.js';
import Group from '../models/Group.js';
import Balance from '../models/Balance.js';
import mongoose from 'mongoose';

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { description, amount, group, payer, splits, category, date } = req.body;
    
    // Validate input
    if (!description || !amount || !group || !payer || !splits || splits.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check if group exists and user is a member
    const groupDoc = await Group.findOne({ 
      _id: group,
      members: req.user._id,
    });
    
    if (!groupDoc) {
      return res.status(404).json({ message: 'Group not found or you are not a member' });
    }
    
    // Validate split amounts
    const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0);
    
    if (Math.abs(totalSplit - amount) > 0.01) { // Allow small rounding errors
      return res.status(400).json({ message: 'Split amounts must equal total expense amount' });
    }
    
    // Create expense
    const expense = await Expense.create({
      description,
      amount,
      group,
      payer,
      splits,
      category: category || 'Other',
      date: date || new Date(),
    });
    
    // Update balances
    for (const split of splits) {
      if (split.user.toString() === payer.toString()) {
        // Payer's own share - no balance update needed
        continue;
      }
      
      // Increase payer's balance (they are owed money)
      await Balance.findOneAndUpdate(
        { user: payer, group },
        { $inc: { amount: split.amount } },
        { session }
      );
      
      // Decrease borrower's balance (they owe money)
      await Balance.findOneAndUpdate(
        { user: split.user, group },
        { $inc: { amount: -split.amount } },
        { session }
      );
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(201).json(expense);
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get expenses by filter
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res) => {
  try {
    const { group } = req.query;
    
    // Build filter
    const filter = {
      $or: [
        { payer: req.user._id },
        { 'splits.user': req.user._id }
      ]
    };
    
    if (group) {
      filter.group = group;
      
      // Verify user is member of group
      const groupDoc = await Group.findOne({ 
        _id: group,
        members: req.user._id,
      });
      
      if (!groupDoc) {
        return res.status(404).json({ message: 'Group not found or you are not a member' });
      }
    }
    
    const expenses = await Expense.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .populate('payer', 'name')
      .populate('group', 'name');
    
    res.json(expenses);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get expense by ID
// @route   GET /api/expenses/:id
// @access  Private
export const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      $or: [
        { payer: req.user._id },
        { 'splits.user': req.user._id }
      ]
    })
    .populate('payer', 'name')
    .populate('group', 'name')
    .populate('splits.user', 'name');
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found or you do not have access' });
    }
    
    res.json(expense);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get expense statistics
// @route   GET /api/expenses/stats
// @access  Private
export const getExpenseStats = async (req, res) => {
  try {
    const { group } = req.query;
    
    if (!group) {
      return res.status(400).json({ message: 'Group ID is required' });
    }
    
    // Verify user is member of group
    const groupDoc = await Group.findOne({ 
      _id: group,
      members: req.user._id,
    });
    
    if (!groupDoc) {
      return res.status(404).json({ message: 'Group not found or you are not a member' });
    }
    
    // Get total expenses for group
    const expenses = await Expense.find({ group });
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Get expenses by category
    const categoryMap = {};
    
    expenses.forEach(expense => {
      const category = expense.category || 'Other';
      if (!categoryMap[category]) {
        categoryMap[category] = 0;
      }
      categoryMap[category] += expense.amount;
    });
    
    const byCategory = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount,
    })).sort((a, b) => b.amount - a.amount);
    
    res.json({
      total,
      byCategory,
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};