const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['pending', 'planning', 'in-progress', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add middleware to update status when members are added
projectSchema.pre('save', function(next) {
  if (this.isModified('members') && this.members.length > 0) {
    this.status = 'planning';
  }
  next();
});

// Add method to update status based on tasks
projectSchema.methods.updateStatusBasedOnTasks = async function() {
  const Task = mongoose.model('Task');
  const tasksCount = await Task.countDocuments({ projectId: this._id });
  
  if (tasksCount > 0 && this.status === 'planning') {
    this.status = 'in-progress';
    await this.save();
  }
  return this.status;
};

// Add static method for safe deletion without transactions
projectSchema.statics.deleteProjectWithTasks = async function(projectId) {
  try {
    // First delete all associated tasks
    const Task = mongoose.model('Task');
    await Task.deleteMany({ projectId });

    // Then delete the project
    const deletedProject = await this.findByIdAndDelete(projectId);
    
    if (!deletedProject) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteProjectWithTasks:', error);
    throw error;
  }
};

module.exports = mongoose.models.Project || mongoose.model('Project', projectSchema);