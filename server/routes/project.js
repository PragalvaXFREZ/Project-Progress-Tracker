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
    // Change from req.user._id to req.user.userId
    const userId = req.user.userId;
    console.log('Current user ID:', userId);

    // First, verify user exists
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('Found user:', user.email);

    // Find projects with detailed logging
    const query = {
      $or: [
        { createdBy: userId },
        { members: { $in: [userId] } }
      ]
    };
    console.log('Project query:', JSON.stringify(query));

    const projects = await Project.find(query)
      .populate('members', 'email')
      .populate('createdBy', 'email');

    console.log('Projects found:', projects.length);
    console.log('Project IDs:', projects.map(p => p._id));

    if (projects.length === 0) {
      console.log('No projects found for user');
      return res.json([]); // Return empty array instead of error
    }

    const projectReports = await Promise.all(projects.map(async (project) => {
      console.log(`Processing project: ${project.name} (${project._id})`);
      
      const tasks = await Task.find({ project: project._id })
        .populate('assignedTo', 'email');
      
      console.log(`Found ${tasks.length} tasks for project ${project.name}`);

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => 
        task.status === 'completed' || task.status === 'accepted'
      ).length;
      const overdueTasks = tasks.filter(task => 
        new Date(task.deadline) < new Date() && task.status !== 'completed'
      ).length;

      // Calculate completion rate
      const completionRate = totalTasks ? 
        ((completedTasks / totalTasks) * 100).toFixed(2) : 0;

      // Only consider project overdue if it's not completed
      const isOverdue = project.status !== 'completed' && 
        project.deadline ? new Date(project.deadline) < new Date() : false;

      return {
        _id: project._id,
        name: project.name,
        description: project.description,
        status: project.status,
        createdAt: project.createdAt,
        deadline: project.deadline,
        isOverdue: isOverdue,
        metrics: {
          total: totalTasks,
          completed: completedTasks,
          pending: totalTasks - completedTasks,
          overdue: tasks.filter(task => 
            task.status !== 'completed' && 
            task.status !== 'accepted' &&
            new Date(task.deadline) < new Date()
          ).length
        },
        taskStatus: {
          pending: tasks.filter(task => task.status === 'pending').length,
          inProgress: tasks.filter(task => task.status === 'in-progress').length,
          completed: tasks.filter(task => task.status === 'completed').length,
          accepted: tasks.filter(task => task.status === 'accepted').length
        }
      };
    }));

    console.log(`Generated ${projectReports.length} project reports`);
    res.json(projectReports);

  } catch (error) {
    console.error('Error in /reports:', error);
    res.status(500).json({ 
      error: 'Error fetching reports',
      details: error.message
    });
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
    const project = await Project.findById(projectId)
      .populate('members', 'email')
      .populate('createdBy', 'email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get all tasks for the project
    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo', 'email');

    // Calculate project metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => 
      task.status === 'completed' || task.status === 'accepted'
    ).length;
    const overdueTasks = tasks.filter(task => 
      new Date(task.deadline) < new Date() && task.status !== 'completed'
    ).length;

    // Calculate member statistics
    const memberStats = project.members.map(member => {
      const memberTasks = tasks.filter(task => 
        task.assignedTo._id.toString() === member._id.toString()
      );
      
      return {
        email: member.email,
        totalAssigned: memberTasks.length,
        completed: memberTasks.filter(task => 
          task.status === 'completed' || task.status === 'accepted'
        ).length,
        overdue: memberTasks.filter(task => 
          new Date(task.deadline) < new Date() && task.status !== 'completed'
        ).length
      };
    });

    // Calculate project duration
    const projectDuration = {
      start: project.createdAt,
      deadline: project.deadline,
      daysRemaining: Math.ceil((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24)),
      isOverdue: project.status !== 'completed' && new Date(project.deadline) < new Date()
    };

    // Compile the report
    const projectReport = {
      projectDetails: {
        name: project.name,
        description: project.description,
        status: project.status,
        createdBy: project.createdBy.email,
        createdAt: project.createdAt,
        completionRate: totalTasks ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0
      },
      taskMetrics: {
        total: totalTasks,
        completed: completedTasks,
        pending: totalTasks - completedTasks,
        overdue: overdueTasks,
        completionRate: totalTasks ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0
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
        accepted: tasks.filter(task => task.status === 'accepted').length,
        overdueTasks: tasks.filter(task => 
          task.status !== 'completed' && 
          task.status !== 'accepted' && 
          new Date(task.deadline) < new Date()
        ).length
      }
    };

    res.json(projectReport);
  } catch (error) {
    console.error('Error generating project report:', error);
    res.status(500).json({ error: 'Error generating project report' });
  }
});

module.exports = router;