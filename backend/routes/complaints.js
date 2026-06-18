const express = require('express');
const { check, validationResult } = require('express-validator');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Agent = require('../models/Agent');
const { protect, authorize } = require('../middleware/auth');
const nodemailer = require('nodemailer');

const router = express.Router();

// Helper function to send simulated email notification
const sendNotificationEmail = async (toEmail, subject, textContent) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
      port: parseInt(process.env.EMAIL_PORT || '2525'),
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
      },
    });

    const info = await transporter.sendMail({
      from: '"Complaint Desk" <noreply@complaintsystem.com>',
      to: toEmail,
      subject: subject,
      text: textContent,
    });
    console.log(`Email notification sent: ${info.messageId}`);
  } catch (error) {
    // Fail silently on email config issues but log to console
    console.log(`Nodemailer simulation logging: [Email to ${toEmail}] [Subject: ${subject}] [Content: ${textContent}]`);
  }
};

// @route   POST /api/complaints
// @desc    Create a new complaint
// @access  Private (USER only)
router.post(
  '/',
  [
    protect,
    authorize('USER'),
    [
      check('title', 'Title is required').notEmpty(),
      check('description', 'Description is required').notEmpty(),
      check('category', 'Category is required').isIn(['Sanitation', 'Utilities', 'Roads', 'Other']),
    ],
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, description, category } = req.body;

    try {
      const complaint = await Complaint.create({
        title,
        description,
        category,
        user: req.user.id,
      });

      // Send email warning to admin (simulated)
      await sendNotificationEmail(
        'admin@complaintsystem.com',
        `New Complaint Submitted: ${title}`,
        `A new complaint has been filed by ${req.user.name} (${req.user.email}) under the category ${category}. Please assign an agent.`
      );

      res.status(201).json({ success: true, data: complaint });
    } catch (err) {
      next(err);
    }
  }
);

// @route   GET /api/complaints
// @desc    Get all complaints based on User role
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    let query;

    if (req.user.role === 'ADMIN') {
      // Admins see all complaints
      query = Complaint.find();
    } else if (req.user.role === 'AGENT') {
      // Agents see only assigned complaints
      query = Complaint.find({ agent: req.user.id });
    } else {
      // Regular users see only their own complaints
      query = Complaint.find({ user: req.user.id });
    }

    // Populate user and agent details (name and email)
    const complaints = await query
      .populate('user', 'name email')
      .populate('agent', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: complaints.length, data: complaints });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/complaints/:id
// @desc    Get a single complaint details
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.id || req.params.id)
      .populate('user', 'name email')
      .populate('agent', 'name email');

    if (!complaint) {
      return res.status(404).json({ success: false, error: 'Complaint not found' });
    }

    // Access control: User can only see their own, Agent can only see their assigned (unless Admin)
    if (
      req.user.role !== 'ADMIN' &&
      complaint.user._id.toString() !== req.user.id &&
      complaint.agent?._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this complaint' });
    }

    res.status(200).json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/complaints/:id
// @desc    Update complaint details / status
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    let complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, error: 'Complaint not found' });
    }

    // User can edit details ONLY if status is Pending
    if (req.user.role === 'USER') {
      if (complaint.user.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to modify this complaint' });
      }

      const { status } = req.body;
      if (status && status === 'Closed') {
        // Users can close resolved complaints
        if (complaint.status !== 'Resolved') {
          return res.status(400).json({ success: false, error: 'Complaint can only be closed once it is Resolved' });
        }
        complaint.status = 'Closed';
      } else {
        if (complaint.status !== 'Pending') {
          return res.status(400).json({ success: false, error: 'Cannot modify complaint details after assignment' });
        }
        const { title, description, category } = req.body;
        if (title) complaint.title = title;
        if (description) complaint.description = description;
        if (category) complaint.category = category;
      }
    }

    // Agent can update status to Resolved
    if (req.user.role === 'AGENT') {
      if (complaint.agent?.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized. Complaint is not assigned to you.' });
      }

      const { status } = req.body;
      if (!status || !['In Progress', 'Resolved'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Agents can only transition status to In Progress or Resolved' });
      }
      complaint.status = status;
    }

    // Admin can update status and agent assignment
    if (req.user.role === 'ADMIN') {
      const { status, agentId } = req.body;
      if (status) complaint.status = status;

      if (agentId !== undefined) {
        const previousAgentId = complaint.agent;
        
        if (agentId === null) {
          // Unassign agent
          complaint.agent = null;
          complaint.status = 'Pending';
        } else {
          // Check if user exists and is actually an AGENT
          const assignedUser = await User.findById(agentId);
          if (!assignedUser || assignedUser.role !== 'AGENT') {
            return res.status(400).json({ success: false, error: 'Assigned ID must belong to an Agent' });
          }

          complaint.agent = agentId;
          complaint.status = 'In Progress';

          // Update Agent collections
          // Add to new agent
          await Agent.findOneAndUpdate(
            { agent: agentId },
            { $addToSet: { assignedComplaints: complaint._id } }
          );
        }

        // Remove from old agent if existed
        if (previousAgentId && previousAgentId.toString() !== agentId) {
          await Agent.findOneAndUpdate(
            { agent: previousAgentId },
            { $pull: { assignedComplaints: complaint._id } }
          );
        }
      }
    }

    await complaint.save();

    // Populate populated fields for return
    complaint = await Complaint.findById(complaint._id)
      .populate('user', 'name email')
      .populate('agent', 'name email');

    // Notify user of status/assignment change
    await sendNotificationEmail(
      complaint.user.email,
      `Complaint Update: ${complaint.title}`,
      `Your complaint status is now "${complaint.status}"` + (complaint.agent ? ` and has been assigned to ${complaint.agent.name}.` : '.')
    );

    res.status(200).json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/complaints/:id
// @desc    Delete a complaint
// @access  Private (ADMIN, or USER if status is Pending)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, error: 'Complaint not found' });
    }

    // Auth validation
    if (req.user.role === 'USER') {
      if (complaint.user.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this complaint' });
      }
      if (complaint.status !== 'Pending') {
        return res.status(400).json({ success: false, error: 'Cannot delete complaint after it is In Progress' });
      }
    } else if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Not authorized to delete complaints' });
    }

    // Remove complaint from agent's queue if assigned
    if (complaint.agent) {
      await Agent.findOneAndUpdate(
        { agent: complaint.agent },
        { $pull: { assignedComplaints: complaint._id } }
      );
    }

    // Delete complaint
    await Complaint.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
