import Group from '../models/Group.js';
import User from '../models/User.js';
import Expense from '../models/Expense.js';
import Balance from '../models/Balance.js';

// @desc    Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const memberIds = Array.from(new Set([...members, req.user._id.toString()]));

    for (const memberId of memberIds) {
      const user = await User.findById(memberId);
      if (!user) {
        return res.status(404).json({ message: `User with ID ${memberId} not found` });
      }
    }

    const group = await Group.create({
      name,
      members: memberIds,
      creator: req.user._id,
    });

    const balancePromises = memberIds.map(userId =>
      Balance.create({ user: userId, group: group._id, amount: 0 })
    );

    await Promise.all(balancePromises);

    res.status(201).json(group);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all groups for current user
export const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id }).sort({ updatedAt: -1 });
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single group by ID
export const getGroupById = async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.id,
      members: req.user._id,
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found or you are not a member' });
    }

    res.json(group);
  } catch (error) {
    console.error('Error fetching group by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get group members
export const getGroupMembers = async (req, res) => {
  try {
    const group = await Group.findOne({
      _id: req.params.id,
      members: req.user._id,
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found or you are not a member' });
    }

    const members = await User.find({ _id: { $in: group.members } }).select('-password');
    res.json(members);
  } catch (error) {
    console.error('Error fetching group members:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update group
export const updateGroup = async (req, res) => {
  try {
    const { name, members } = req.body;

    const group = await Group.findOne({
      _id: req.params.id,
      members: req.user._id,
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found or you are not a member' });
    }

    if (members && !group.creator.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the group creator can add/remove members' });
    }

    if (name) group.name = name;

    if (members) {
      const memberIds = Array.from(new Set([...members, group.creator.toString()]));

      for (const memberId of memberIds) {
        const user = await User.findById(memberId);
        if (!user) {
          return res.status(404).json({ message: `User with ID ${memberId} not found` });
        }
      }

      group.members = memberIds;

      const existingBalances = await Balance.find({ group: group._id });
      const existingUserIds = existingBalances.map(balance => balance.user.toString());

      const newMemberIds = memberIds.filter(id => !existingUserIds.includes(id));

      const balancePromises = newMemberIds.map(userId =>
        Balance.create({ user: userId, group: group._id, amount: 0 })
      );

      await Promise.all(balancePromises);
    }

    const updatedGroup = await group.save();
    res.json(updatedGroup);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete group
export const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.creator.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the group creator can delete the group' });
    }

    const expenses = await Expense.findOne({ group: group._id });
    if (expenses) {
      return res.status(400).json({ message: 'Cannot delete group with existing expenses' });
    }

    await Promise.all([
      group.deleteOne(),
      Balance.deleteMany({ group: group._id }),
    ]);

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
