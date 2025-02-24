const express = require('express');
const router = express.Router();
const Project = require('../Models/Project');
const User = require('../models/User');

// Create project
router.post('/create', async (req, res) => {
  try {
      const { name, description, createdBy } = req.body;
      
      console.log('Received project data:', { name, description, createdBy });
      
      if (!name || !createdBy) {
          return res.status(400).json({ error: 'Project name and creator ID are required' });
      }

      const project = new Project({
          name,
          description: description || '',
          createdBy,
          members: [createdBy]
      });

      console.log('Created project object:', project);

      const savedProject = await project.save();
      console.log('Saved project:', savedProject);

      const populatedProject = await Project.findById(savedProject._id)
          .populate('members', 'email')
          .populate('createdBy', 'email');

      res.status(201).json({ 
          message: 'Project created successfully',
          project: populatedProject
      });
  } catch (error) {
      console.error('Detailed error:', error);
      res.status(500).json({ 
          error: 'Error creating project',
          details: error.message 
      });
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

module.exports = router;