const mongoose = require('mongoose');

const AgentSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  assignedComplaints: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
    },
  ],
  status: {
    type: String,
    enum: ['Available', 'Busy', 'Offline'],
    default: 'Available',
  },
});

module.exports = mongoose.model('Agent', AgentSchema);
