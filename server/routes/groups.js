import express from 'express';
import {
  createGroup,
  getGroups,
  getGroupById,
  getGroupMembers,
  updateGroup,
  deleteGroup,
} from '../controllers/groupController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(protect, getGroups).post(protect, createGroup);
router.route('/:id').get(protect, getGroupById).put(protect, updateGroup).delete(protect, deleteGroup);
router.get('/:id/members', protect, getGroupMembers);

export default router;
