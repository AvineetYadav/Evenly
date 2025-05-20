import Balance from '../models/Balance.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// @desc    Get balances for user
// @route   GET /api/balances
// @access  Private
export const getBalances = async (req, res) => {
  try {
    const { group } = req.query;
    
    let filter = {};
    
    if (group) {
      // Verify user is member of group
      const groupDoc = await Group.findOne({ 
        _id: group,
        members: req.user._id,
      });
      
      if (!groupDoc) {
        return res.status(404).json({ message: 'Group not found or you are not a member' });
      }
      
      // Get balances for all users in this group
      const balances = await Balance.find({ group })
        .populate('user', 'name');
      
      // Format response
      const formattedBalances = balances.map(balance => ({
        user: balance.user._id,
        name: balance.user.name,
        amount: balance.amount,
      }));
      
      return res.json(formattedBalances);
    } else {
      // Get summary of balances across all groups
      const groups = await Group.find({ members: req.user._id });
      const groupIds = groups.map(group => group._id);
      
      // Get all balances for current user
      const userBalances = await Balance.find({
        user: req.user._id,
        group: { $in: groupIds },
      }).populate('group', 'name');
      
      // Get all balances where current user is involved
      const otherBalances = await Balance.find({
        user: { $ne: req.user._id },
        group: { $in: groupIds },
      }).populate('user', 'name');
      
      // Group by user and aggregate amounts
      const balanceMap = {};
      
      otherBalances.forEach(balance => {
        const userId = balance.user._id.toString();
        
        if (!balanceMap[userId]) {
          balanceMap[userId] = {
            userId,
            name: balance.user.name,
            amount: 0,
          };
        }
        
        // If other user has negative balance (they owe), current user gets positive (they are owed)
        // If other user has positive balance (they are owed), current user gets negative (they owe)
        balanceMap[userId].amount -= balance.amount;
      });
      
      // Format response
      const formattedBalances = Object.values(balanceMap);
      
      return res.json(formattedBalances);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get balance summary
// @route   GET /api/balances/summary
// @access  Private
export const getBalanceSummary = async (req, res) => {
  try {
    // Get all groups for current user
    const groups = await Group.find({ members: req.user._id });
    const groupIds = groups.map(group => group._id);
    
    // Get all balances for current user
    const userBalances = await Balance.find({
      user: req.user._id,
      group: { $in: groupIds },
    });
    
    // Get all balances where current user is involved
    const otherBalances = await Balance.find({
      user: { $ne: req.user._id },
      group: { $in: groupIds },
    }).populate('user', 'name');
    
    // Calculate total balances
    let totalYouOwe = 0;
    let totalYouAreOwed = 0;
    
    // Group by user and aggregate amounts
    const balanceMap = {};
    
    otherBalances.forEach(balance => {
      const userId = balance.user._id.toString();
      
      if (!balanceMap[userId]) {
        balanceMap[userId] = {
          userId,
          name: balance.user.name,
          amount: 0,
        };
      }
      
      // If other user has negative balance (they owe), current user gets positive (they are owed)
      // If other user has positive balance (they are owed), current user gets negative (they owe)
      balanceMap[userId].amount -= balance.amount;
    });
    
    const balances = Object.values(balanceMap);
    
    // Calculate totals
    balances.forEach(balance => {
      if (balance.amount < 0) {
        totalYouOwe += Math.abs(balance.amount);
      } else if (balance.amount > 0) {
        totalYouAreOwed += balance.amount;
      }
    });
    
    res.json({
      balances,
      youOwe: totalYouOwe,
      youAreOwed: totalYouAreOwed,
      net: totalYouAreOwed - totalYouOwe,
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};