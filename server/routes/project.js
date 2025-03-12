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

module.exports = router;