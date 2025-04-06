const express = require('express');
const router = express.Router();
const Project = require('../Models/Project');
const User = require('../Models/User');
const Task = require('../Models/Task');

// Create project
router.post('/create', async (req, res) => {
  try {
    const { name, description, createdBy, deadline } = req.body;
    
    console.log('Received project data:', { name, description, createdBy, deadline });
    
    if (!name || !createdBy || !deadline) {
      return res.status(400).json({ error: 'Name, creator ID, and deadline are required' });
    }

    const project = new Project({
      name,
      description: description || '',
      createdBy,
      members: [createdBy],
      deadline: new Date(deadline)
    });

    console.log('Created project object:', project);

    const savedProject = await project.save();
    
    const populatedProject = await Project.findById(savedProject._id)
      .populate('members', 'email')
      .populate('createdBy', 'email');

    res.status(201).json({ 
      message: 'Project created successfully',
      project: populatedProject
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's projects
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let projects;
        if (user.isAdmin) {
            projects = await Project.find({ createdBy: userId })
                .populate('members', 'email')
                .populate('createdBy', 'email');
        } else {
            projects = await Project.find({ members: userId })
                .populate('members', 'email')
                .populate('createdBy', 'email');
        }

        res.status(200).json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Error fetching projects' });
    }
});

// Add member to project
router.post('/:projectId/members', async (req, res) => {
  try {
    const { email } = req.body;
    const projectId = req.params.projectId;

    // Find the project first
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      // Store as pending invite if user doesn't exist
      if (!project.pendingInvites.some(invite => invite.email === email)) {
        project.pendingInvites.push({ email });
        await project.save();
      }
      
      const updatedProject = await Project.findById(projectId)
        .populate('members', 'email')
        .populate('createdBy', 'email');

      return res.status(200).json({ 
        message: 'Invitation pending until user registers',
        project: updatedProject
      });
    }

    // Check if user is already a member
    if (project.members.includes(user._id)) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    // Add user to project members
    project.members.push(user._id);
    await project.save();

    // Fetch updated project with populated fields
    const updatedProject = await Project.findById(projectId)
      .populate('members', 'email')
      .populate('createdBy', 'email');

    res.status(200).json({ 
      message: 'Member added successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ error: 'Error adding member to project' });
  }
});

// Get project members
router.get('/:projectId/members', async (req, res) => {
  try {
    console.log('Fetching members for project:', req.params.projectId);
    const project = await Project.findById(req.params.projectId)
      .populate('members', 'email _id');
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    console.log('Found members:', project.members);
    // Send only the members array
    res.json(project.members);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Error fetching project members' });
  }
});

// IMPORTANT: Place this route BEFORE any routes with :projectId
router.get('/archived', async (req, res) => {
  try {
    const archivedProjects = await Project.find({ 
      status: 'completed'  // This is already correct
    })
    .populate('members', 'email')
    .populate('createdBy', 'email');

    console.log('Fetching archived projects:', archivedProjects);
    res.json(archivedProjects);
  } catch (error) {
    console.error('Error fetching archived projects:', error);
    res.status(500).json({ error: 'Error fetching archived projects' });
  }
});

// Get archived projects for a specific user
router.get('/archived/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const archivedProjects = await Project.find({
      $and: [
        { status: 'completed' }, // Changed from 'archived' to 'completed'
        {
          $or: [
            { createdBy: userId },
            { members: userId }
          ]
        }
      ]
    })
    .populate('members', 'email')
    .populate('createdBy', 'email');

    console.log('Fetched archived projects for user:', userId, archivedProjects);
    res.json(archivedProjects);
  } catch (error) {
    console.error('Error fetching archived projects:', error);
    res.status(500).json({ message: 'Error fetching archived projects' });
  }
});

// Add the reports route BEFORE the :projectId routes
router.get('/reports', async (req, res) => {
  try {
    // Get all projects
    const userId = req.user.userId;
    const projects = await Project.find({
      $or: [
        { createdBy: userId },
        { members: userId }
      ]
    })
    .populate('members', 'email')
    .populate('createdBy', 'email');

    console.log('Projects found:', projects.length);

    // Get all tasks for all projects
    const projectReports = await Promise.all(projects.map(async (project) => {
      const tasks = await Task.find({ projectId: project._id })
        .populate('assignedTo', 'email')
        .lean();

      console.log(`Tasks for ${project.name}:`, tasks.length);

      // Calculate metrics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => 
        task.status === 'completed' || task.status === 'accepted'
      ).length;
      const pendingTasks = tasks.filter(task => 
        task.status === 'pending' || task.status === 'in-progress'
      ).length;
      const overdueTasks = tasks.filter(task => 
        task.status !== 'completed' && 
        task.status !== 'accepted' && 
        new Date(task.deadline) < new Date()
      ).length;

      // Return report data
      return {
        _id: project._id,
        name: project.name,
        description: project.description,
        status: project.status,
        createdAt: project.createdAt,
        createdBy: project.createdBy.email,
        deadline: project.deadline,
        metrics: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          overdue: overdueTasks,
          completionRate: totalTasks ? ((completedTasks / totalTasks) * 100).toFixed(1) : "0"
        },
        isOverdue: project.status !== 'completed' && new Date(project.deadline) < new Date()
      };
    }));

    console.log('Generated reports:', projectReports.length);
    res.json(projectReports);

  } catch (error) {
    console.error('Error in /reports:', error);
    res.status(500).json({ error: 'Error fetching reports' });
  }
});

// Get single project by ID
router.get('/:projectId', async (req, res) => {
  try {
    console.log('Fetching project with ID:', req.params.projectId); // Add this log
    const project = await Project.findById(req.params.projectId)
      .populate('members', 'email')
      .populate('createdBy', 'email');
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    console.log('Found project:', project); // Add this log
    res.json(project);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Error fetching project details' });
  }
});

router.delete('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log('Attempting to delete project:', projectId);
    
    const result = await Project.deleteProjectWithTasks(projectId);
    
    if (result) {
      console.log('Project deleted successfully');
      res.status(204).end();
    } else {
      console.log('Project not found');
      res.status(404).json({ error: 'Project not found' });
    }
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: error.message || 'Error deleting project' });
  }
});

// Add this new route for updating project status
router.patch('/:projectId/status', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['pending', 'planning', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    project.status = status;
    await project.save();

    res.json(project);
  } catch (error) {
    console.error('Error updating project status:', error);
    res.status(500).json({ error: 'Error updating project status' });
  }
});

router.patch('/:projectId/archive', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    project.status = 'completed';
    project.completionDate = new Date();
    await project.save();

    const updatedProject = await Project.findById(req.params.projectId)
      .populate('members', 'email')
      .populate('createdBy', 'email');

    res.json(updatedProject);
  } catch (error) {
    console.error('Error archiving project:', error);
    res.status(500).json({ error: 'Error archiving project' });
  }
});

// Get project reports
router.get('/:projectId/report', async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log('Generating report for project:', projectId);

    const project = await Project.findById(projectId)
      .populate('members', 'email')
      .populate('createdBy', 'email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get tasks using projectId field
    const tasks = await Task.find({ projectId: project._id })
      .populate('assignedTo', 'email')
      .lean();

    console.log(`Found ${tasks.length} tasks for project ${project.name}`);

    // Calculate task metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => 
      task.status === 'completed' || task.status === 'accepted'
    ).length;
    const pendingTasks = tasks.filter(task => 
      task.status === 'pending' || task.status === 'in-progress'
    ).length;
    const overdueTasks = tasks.filter(task => 
      task.status !== 'completed' && 
      task.status !== 'accepted' && 
      new Date(task.deadline) < new Date()
    ).length;

    // Calculate member statistics - exclude creator
    const memberStats = await Promise.all(project.members
      .filter(member => member._id.toString() !== project.createdBy._id.toString())
      .map(async (member) => {
        const memberTasks = tasks.filter(task => 
          task.assignedTo._id.toString() === member._id.toString()
        );
        
        const completedTasks = memberTasks.filter(task => 
          task.status === 'completed' || task.status === 'accepted'
        ).length;
        
        return {
          email: member.email,
          totalAssigned: memberTasks.length,
          completed: completedTasks,
          completionRate: memberTasks.length ? 
            ((completedTasks / memberTasks.length) * 100).toFixed(1) : "0",
          overdue: memberTasks.filter(task => 
            task.status !== 'completed' && 
            task.status !== 'accepted' && 
            new Date(task.deadline) < new Date()
          ).length
        };
    }));

    // Calculate status change metrics
    const formatDuration = (startDate, endDate) => {
      const diff = new Date(endDate) - new Date(startDate);
      const minutes = Math.ceil(diff / (1000 * 60));
      const hours = Math.ceil(diff / (1000 * 60 * 60));
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
      if (minutes < 60) {
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
      } else if (hours < 24) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
      } else {
        return `${days} ${days === 1 ? 'day' : 'days'}`;
      }
    };

    const taskStatusChanges = tasks.map(task => ({
      taskId: task._id,
      taskTitle: task.title,
      assignedTo: task.assignedTo.email,
      statusHistory: task.statusHistory.map((change, index) => {
        const startDate = index === 0 ? task.createdAt : task.statusHistory[index - 1].changedAt;
        const endDate = change.changedAt;

        return {
          from: change.from,
          to: change.to,
          changedAt: change.changedAt,
          duration: formatDuration(startDate, endDate)
        };
      })
    }));
    
    // Calculate average times
    const calculateAverageDuration = (tasks, targetStatus) => {
      const durations = [];
      
      tasks.forEach(task => {
        if (task.statusHistory?.length) {
          const statusChange = task.statusHistory.find(change => change.to === targetStatus);
          if (statusChange) {
            const diff = new Date(statusChange.changedAt) - new Date(task.createdAt);
            const minutes = Math.ceil(diff / (1000 * 60));
            durations.push(minutes);
          }
        }
      });
    
      if (durations.length === 0) return 'N/A';
      const avgMinutes = durations.reduce((a, b) => a + b, 0) / durations.length;
      
      if (avgMinutes < 60) {
        return `${Math.ceil(avgMinutes)} minutes`;
      } else if (avgMinutes < 1440) { // 24 hours * 60 minutes
        const hours = Math.ceil(avgMinutes / 60);
        return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
      } else {
        const days = Math.ceil(avgMinutes / 1440);
        return `${days} ${days === 1 ? 'day' : 'days'}`;
      }
    };

    const calculateTaskTimings = (tasks) => {
      const timings = tasks.map(task => {
        // Skip if no status history
        if (!task.statusHistory?.length) return null;
    
        const assignmentDate = new Date(task.createdAt);
        let firstReviewDate = null;
        let adminResponseDate = null;
        let completionDate = null;
    
        // Go through status history chronologically
        task.statusHistory.forEach(change => {
          const changeDate = new Date(change.changedAt);
          
          // First time task is submitted for review
          if (change.to === 'review' && !firstReviewDate) {
            firstReviewDate = changeDate;
          }
          
          // Admin's first accept/reject decision
          if ((change.to === 'accepted' || change.to === 'rejected') && firstReviewDate && !adminResponseDate) {
            adminResponseDate = changeDate;
          }
    
          // Final completion
          if (change.to === 'completed') {
            completionDate = changeDate;
          }
        });
    
        return {
          timeToReview: firstReviewDate ? firstReviewDate - assignmentDate : null,
          adminResponseTime: adminResponseDate && firstReviewDate ? adminResponseDate - firstReviewDate : null,
          totalCompletionTime: completionDate ? completionDate - assignmentDate : null
        };
      }).filter(Boolean); // Remove null entries
    
      // Calculate averages
      const calculateAverage = (times) => {
        if (!times.length) return 'N/A';
        const avgMinutes = times.reduce((sum, time) => sum + time, 0) / (times.length * 60000); // Convert to minutes
    
        if (avgMinutes < 60) {
          return `${Math.ceil(avgMinutes)} minutes`;
        } else if (avgMinutes < 1440) { // 24 hours
          const hours = Math.ceil(avgMinutes / 60);
          return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
        } else {
          const days = Math.ceil(avgMinutes / 1440);
          return `${days} ${days === 1 ? 'day' : 'days'}`;
        }
      };
    
      return {
        averageTimeToReview: calculateAverage(timings.map(t => t.timeToReview).filter(Boolean)),
        averageAdminResponseTime: calculateAverage(timings.map(t => t.adminResponseTime).filter(Boolean)),
        averageTotalCompletionTime: calculateAverage(timings.map(t => t.totalCompletionTime).filter(Boolean))
      };
    };

    const projectReport = {
      projectDetails: {
        name: project.name,
        description: project.description,
        status: project.status,
        createdBy: project.createdBy.email,
        createdAt: project.createdAt
      },
      taskMetrics: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        overdue: overdueTasks,
        completionRate: totalTasks ? 
          parseFloat(((completedTasks / totalTasks) * 100).toFixed(1)) : 0
      },
      memberStats,
      projectDuration: {
        start: project.createdAt,
        deadline: project.deadline,
        daysRemaining: Math.ceil((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24)),
        isOverdue: project.status !== 'completed' && new Date(project.deadline) < new Date()
      },
      taskStatus: {
        pending: tasks.filter(task => task.status === 'pending').length,
        inProgress: tasks.filter(task => task.status === 'in-progress').length,
        completed: tasks.filter(task => task.status === 'completed').length,
        accepted: tasks.filter(task => task.status === 'accepted').length
      },
      taskStatusChanges,
      averageMetrics: {
        timeToReview: calculateAverageDuration(tasks, 'review'),
        timeToAcceptance: calculateAverageDuration(tasks, 'accepted'),
        timeToCompletion: calculateAverageDuration(tasks, 'completed')
      },
      averageMetrics: calculateTaskTimings(tasks)
    };

    // Inside your project report route
    projectReport.averageMetrics = {
      averageTimeToReview: calculateTaskTimings(tasks).averageTimeToReview,
      averageAdminResponseTime: calculateTaskTimings(tasks).averageAdminResponseTime,
      averageTotalCompletionTime: calculateTaskTimings(tasks).averageTotalCompletionTime
    };

    console.log('Sending metrics:', projectReport.averageMetrics);
    res.json(projectReport);
  } catch (error) {
    console.error('Error generating project report:', error);
    res.status(500).json({ error: 'Error generating project report' });
  }
});

module.exports = router;