const express = require('express');
const router = express.Router();
const Task = require('../Models/Task');
const Project = require('../Models/Project');

// Get all tasks for a project
router.get('/projects/:projectId/tasks', async (req, res) => {
  try {
    const tasks = await Task.find({ projectId: req.params.projectId })
      .populate('assignedTo', 'email');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching tasks' });
  }
});

// Create a new task
router.post('/projects/:projectId/tasks', async (req, res) => {
  try {
    const { title, description, assignedTo, deadline } = req.body;
    const task = new Task({
      projectId: req.params.projectId,
      title,
      description,
      assignedTo,
      deadline,
      status: 'pending'
    });
    await task.save();
    const populatedTask = await Task.findById(task._id).populate('assignedTo', 'email');
    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Error creating task' });
  }
});

// Update the existing route to match the frontend endpoint
router.patch('/projects/:projectId/tasks/:taskId/status', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const task = await Task.findByIdAndUpdate(
      taskId,
      { status },
      { new: true }
    ).populate('assignedTo', 'email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ message: 'Error updating task status', error: error.message });
  }
});

router.get('/projects/:projectId/tasks/user/:userId', async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const tasks = await Task.find({ 
      projectId,
      assignedTo: userId
    }).populate('assignedTo', 'email');
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    res.status(500).json({ error: 'Error fetching tasks' });
  }
});

module.exports = router;