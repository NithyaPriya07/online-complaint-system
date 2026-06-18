const express = require('express');
const User = require('../models/User');
const Agent = require('../models/Agent');
const Complaint = require('../models/Complaint');
const Feedback = require('../models/Feedback');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/agents
// @desc    Get all agents
// @access  Private (ADMIN only)
router.get('/', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    // Find all users with role AGENT
    const agents = await Agent.find().populate('agent', 'name email role');
    res.status(200).json({ success: true, count: agents.length, data: agents });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/agents/stats
// @desc    Get system-wide analytics stats
// @access  Private (ADMIN only)
router.get('/stats', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const pendingCount = await Complaint.countDocuments({ status: 'Pending' });
    const inProgressCount = await Complaint.countDocuments({ status: 'In Progress' });
    const resolvedCount = await Complaint.countDocuments({ status: 'Resolved' });
    const closedCount = await Complaint.countDocuments({ status: 'Closed' });

    // Category breakdown
    const categoryStats = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    // Average rating
    const ratingStats = await Feedback.aggregate([
      { $group: { _id: null, averageRating: { $avg: '$rating' }, totalFeedbacks: { $sum: 1 } } },
    ]);

    const averageRating = ratingStats.length > 0 ? ratingStats[0].averageRating : 0;
    const feedbackCount = ratingStats.length > 0 ? ratingStats[0].totalFeedbacks : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          total: totalComplaints,
          pending: pendingCount,
          inProgress: inProgressCount,
          resolved: resolvedCount,
          closed: closedCount,
        },
        categoryStats,
        feedback: {
          averageRating: parseFloat(averageRating.toFixed(1)),
          count: feedbackCount,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
