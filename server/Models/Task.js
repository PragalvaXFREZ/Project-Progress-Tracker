const mongoose = require('mongoose');

const statusChangeSchema = new mongoose.Schema({
  from: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'accepted', 'review', 'rejected'],
    required: true
  },
  to: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'accepted', 'review', 'rejected'],
    required: true
  },
  changedAt: {
    type: Date,
    default: Date.now
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Changed from true to false
  }
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'accepted', 'review', 'rejected'], 
    default: 'pending'
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  statusHistory: [{
    from: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'accepted', 'review', 'rejected'],
      required: true
    },
    to: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'accepted', 'review', 'rejected'],
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    }
  }]
});

// Add pre-save middleware to track status changes
taskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const previousStatus = this._previousStatus || this.status;
    this.statusHistory.push({
      from: previousStatus,
      to: this.status,
      changedBy: this._currentUser // This needs to be set when updating the task
    });
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);