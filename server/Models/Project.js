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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

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