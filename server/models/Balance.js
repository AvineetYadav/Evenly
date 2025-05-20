import mongoose from 'mongoose';

const balanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  amount: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure uniqueness of user-group pairs
balanceSchema.index({ user: 1, group: 1 }, { unique: true });

const Balance = mongoose.model('Balance', balanceSchema);

export default Balance;