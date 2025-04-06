// filepath: c:\Users\T_Poison\Desktop\New folder\Project-Progress-Tracker\server\routes\userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../Models/User');
const Project = require('../Models/Project');
const Task = require('../Models/Task');
const auth = require('../middleware/auth');

// Get user statistics
router.get('/:userId/stats', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Verify user is requesting their own data
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Find all projects the user is a member of
    const projects = await Project.find({
      members: userId
    }).lean();
    
    // Find all tasks assigned to the user
    const tasks = await Task.find({
      assignedTo: userId
    }).lean();
    
    // Calculate statistics
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'accepted').length;
    
    // Calculate task distribution
    const taskDistribution = {
      pending: Math.round(tasks.filter(t => t.status === 'pending').length / totalTasks * 100) || 0,
      inProgress: Math.round(tasks.filter(t => t.status === 'in-progress').length / totalTasks * 100) || 0,
      review: Math.round(tasks.filter(t => t.status === 'review').length / totalTasks * 100) || 0,
      completed: Math.round(tasks.filter(t => t.status === 'completed' || t.status === 'accepted').length / totalTasks * 100) || 0
    };
    
    // Get recent activity (from task status changes)
    const recentActivity = [];
    for (const task of tasks) {
      if (task.statusHistory && task.statusHistory.length) {
        const project = projects.find(p => p._id.toString() === task.projectId.toString());
        
        if (project) {
          // Get most recent 5 status changes for tasks
          for (const change of task.statusHistory.slice(-5)) {
            recentActivity.push({
              date: change.changedAt,
              projectName: project.name,
              action: `Task "${task.title}" changed from ${change.from} to ${change.to}`
            });
          }
        }
      }
    }
    
    // Sort activity by date desc and limit to 10
    recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
    const limitedActivity = recentActivity.slice(0, 10);
    
    // Prepare project details
    const projectDetails = await Promise.all(projects.map(async (project) => {
      const projectTasks = await Task.find({
        projectId: project._id,
        assignedTo: userId
      }).lean();
      
      const totalProjectTasks = projectTasks.length;
      const completedProjectTasks = projectTasks.filter(t => 
        t.status === 'completed' || t.status === 'accepted'
      ).length;
      
      const completionPercentage = totalProjectTasks 
        ? Math.round((completedProjectTasks / totalProjectTasks) * 100) 
        : 0;
      
      return {
        _id: project._id,
        name: project.name,
        status: project.status,
        deadline: project.deadline,
        totalTasks: totalProjectTasks,
        completedTasks: completedProjectTasks,
        completionPercentage,
        isOverdue: project.status !== 'completed' && new Date(project.deadline) < new Date()
      };
    }));
    
    // Calculate overall completion rate
    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    res.json({
      totalProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      completionRate,
      taskDistribution,
      recentActivity: limitedActivity,
      projects: projectDetails
    });
    
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ error: 'Error fetching user statistics' });
  }
});

module.exports = router;