const express = require('express');
const Message = require('../models/Message');
const Complaint = require('../models/Complaint');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/chat/:complaintId
// @desc    Get chat message history for a complaint
// @access  Private
router.get('/:complaintId', protect, async (req, res, next) => {
  const { complaintId } = req.params;

  try {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, error: 'Complaint not found' });
    }

    // Access control: User can only view their own chat, Agent can only view their assigned chat (unless Admin)
    if (
      req.user.role !== 'ADMIN' &&
      complaint.user.toString() !== req.user.id &&
      complaint.agent?.toString() !== req.user.id
    ) {
      return res.status(403).json({ success: false, error: 'Not authorized to access chat history' });
    }

    const messages = await Message.find({ complaint: complaintId })
      .populate('sender', 'name email role')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
