const express = require('express');
const { check, validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const Complaint = require('../models/Complaint');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/feedback
// @desc    Submit feedback for a resolved complaint
// @access  Private (USER only)
router.post(
  '/',
  [
    protect,
    authorize('USER'),
    [
      check('complaintId', 'Complaint ID is required').notEmpty(),
      check('rating', 'Rating is required and must be between 1 and 5').isInt({ min: 1, max: 5 }),
    ],
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { complaintId, rating, comments } = req.body;

    try {
      const complaint = await Complaint.findById(complaintId);

      if (!complaint) {
        return res.status(404).json({ success: false, error: 'Complaint not found' });
      }

      // Check if complaint is owned by this user
      if (complaint.user.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to submit feedback for this complaint' });
      }

      // Check if complaint is resolved or closed
      if (!['Resolved', 'Closed'].includes(complaint.status)) {
        return res.status(400).json({ success: false, error: 'Feedback can only be submitted for Resolved or Closed complaints' });
      }

      // Check if feedback already exists for this complaint
      const existingFeedback = await Feedback.findOne({ complaint: complaintId });
      if (existingFeedback) {
        return res.status(400).json({ success: false, error: 'Feedback already submitted for this complaint' });
      }

      const feedback = await Feedback.create({
        complaint: complaintId,
        user: req.user.id,
        rating,
        comments,
      });

      res.status(201).json({ success: true, data: feedback });
    } catch (err) {
      next(err);
    }
  }
);

// @route   GET /api/feedback
// @desc    Get all feedback details
// @access  Private (ADMIN/AGENT)
router.get('/', protect, authorize('ADMIN', 'AGENT'), async (req, res, next) => {
  try {
    let query;

    if (req.user.role === 'ADMIN') {
      query = Feedback.find().populate('complaint', 'title category status');
    } else {
      // Agent sees feedback for complaints assigned to them
      // First find complaints assigned to agent
      const complaints = await Complaint.find({ agent: req.user.id }).select('_id');
      const complaintIds = complaints.map((c) => c._id);
      query = Feedback.find({ complaint: { $in: complaintIds } }).populate('complaint', 'title category status');
    }

    const feedback = await query
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: feedback.length, data: feedback });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
