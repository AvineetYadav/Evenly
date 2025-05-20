import Balance from '../models/Balance.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import Settlement from '../models/Settlement.js';
import mongoose from 'mongoose';

// @desc    Create a settlement
// @route   POST /api/settlements
// @access  Private
export const createSettlement = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { payer, receiver, amount, group } = req.body;
    
    // Validate input
    if (!payer || !receiver || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Create settlement record
    const settlement = await Settlement.create({
      payer,
      receiver,
      amount,
      group,
      date: new Date(),
    });
    
    // Update balances
    if (group) {
      // Group-specific settlement
      
      // Verify user is member of group
      const groupDoc = await Group.findOne({ 
        _id: group,
        members: req.user._id,
      });
      
      if (!groupDoc) {
        return res.status(404).json({ message: 'Group not found or you are not a member' });
      }
      
      // Decrease payer's debt (they owe less)
      await Balance.findOneAndUpdate(
        { user: payer, group },
        { $inc: { amount: amount } },
        { session }
      );
      
      // Decrease receiver's credit (they are owed less)
      await Balance.findOneAndUpdate(
        { user: receiver, group },
        { $inc: { amount: -amount } },
        { session }
      );
    } else {
      // Global settlement - need to distribute across groups
      
      // Get groups where both users are members
      const groups = await Group.find({
        members: { $all: [payer, receiver] }
      });
      
      if (groups.length === 0) {
        return res.status(400).json({ message: 'No common groups found for these users' });
      }
      
      // Get balances for payer in these groups
      const payerBalances = await Balance.find({
        user: payer,
        group: { $in: groups.map(g => g._id) }
      }).sort({ amount: 1 }); // Prioritize groups where payer owes the most
      
      // Distribute settlement amount across groups
      let remainingAmount = amount;
      
      for (const balance of payerBalances) {
        if (remainingAmount <= 0) break;
        
        if (balance.amount < 0) {
          // User owes money in this group
          const debtAmount = Math.abs(balance.amount);
          const settlementAmount = Math.min(debtAmount, remainingAmount);
          
          // Update balances in this group
          await Balance.findOneAndUpdate(
            { user: payer, group: balance.group },
            { $inc: { amount: settlementAmount } },
            { session }
          );
          
          await Balance.findOneAndUpdate(
            { user: receiver, group: balance.group },
            { $inc: { amount: -settlementAmount } },
            { session }
          );
          
          remainingAmount -= settlementAmount;
        }
      }
      
      // If still have remaining amount, distribute evenly
      if (remainingAmount > 0) {
        const amountPerGroup = remainingAmount / groups.length;
        
        for (const group of groups) {
          await Balance.findOneAndUpdate(
            { user: payer, group: group._id },
            { $inc: { amount: amountPerGroup } },
            { session }
          );
          
          await Balance.findOneAndUpdate(
            { user: receiver, group: group._id },
            { $inc: { amount: -amountPerGroup } },
            { session }
          );
        }
      }
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(201).json(settlement);
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get suggested settlements
// @route   GET /api/settlements/suggestions
// @access  Private
export const getSettlementSuggestions = async (req, res) => {
  try {
    const { group } = req.query;
    
    let suggestions = [];
    
    if (group) {
      // Group-specific suggestions
      
      // Verify user is member of group
      const groupDoc = await Group.findOne({ 
        _id: group,
        members: req.user._id,
      });
      
      if (!groupDoc) {
        return res.status(404).json({ message: 'Group not found or you are not a member' });
      }
      
      // Get all balances for this group
      const balances = await Balance.find({ group })
        .populate('user', 'name');
      
      // Separate debtors and creditors
      const debtors = balances.filter(b => b.amount < 0)
        .sort((a, b) => a.amount - b.amount); // Most debt first
      
      const creditors = balances.filter(b => b.amount > 0)
        .sort((a, b) => b.amount - a.amount); // Most credit first
      
      // Generate suggestions
      suggestions = generateSettlementSuggestions(debtors, creditors);
      
    } else {
      // Get all groups for current user
      const groups = await Group.find({ members: req.user._id });
      
      if (groups.length === 0) {
        return res.json([]);
      }
      
      // Get all balances between users across all groups
      const balances = await Balance.aggregate([
        {
          $match: {
            group: { $in: groups.map(g => g._id) }
          }
        },
        {
          $group: {
            _id: '$user',
            totalAmount: { $sum: '$amount' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $unwind: '$userInfo'
        },
        {
          $project: {
            _id: 1,
            totalAmount: 1,
            name: '$userInfo.name'
          }
        }
      ]);
      
      // Separate debtors and creditors
      const debtors = balances.filter(b => b.totalAmount < 0)
        .map(d => ({ 
          user: d._id, 
          name: d.name, 
          amount: d.totalAmount 
        }))
        .sort((a, b) => a.amount - b.amount); // Most debt first
      
      const creditors = balances.filter(b => b.totalAmount > 0)
        .map(c => ({ 
          user: c._id, 
          name: c.name, 
          amount: c.totalAmount 
        }))
        .sort((a, b) => b.amount - a.amount); // Most credit first
      
      // Generate suggestions
      suggestions = generateSettlementSuggestions(debtors, creditors);
    }
    
    res.json(suggestions);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to generate settlement suggestions
const generateSettlementSuggestions = (debtors, creditors) => {
  const suggestions = [];
  
  // Create a copy of debtors and creditors to work with
  const debtorsCopy = [...debtors];
  const creditorsCopy = [...creditors];
  
  while (debtorsCopy.length > 0 && creditorsCopy.length > 0) {
    const debtor = debtorsCopy[0];
    const creditor = creditorsCopy[0];
    
    const debtAmount = Math.abs(debtor.amount);
    const creditAmount = creditor.amount;
    
    const settleAmount = Math.min(debtAmount, creditAmount);
    
    if (settleAmount > 0) {
      suggestions.push({
        payer: debtor.user,
        payerName: debtor.name,
        receiver: creditor.user,
        receiverName: creditor.name,
        amount: settleAmount
      });
      
      // Update amounts
      debtor.amount += settleAmount;
      creditor.amount -= settleAmount;
      
      // Remove entries with zero balance
      if (Math.abs(debtor.amount) < 0.01) {
        debtorsCopy.shift();
      }
      
      if (Math.abs(creditor.amount) < 0.01) {
        creditorsCopy.shift();
      }
    } else {
      // No more meaningful settlements possible
      break;
    }
  }
  
  return suggestions;
};