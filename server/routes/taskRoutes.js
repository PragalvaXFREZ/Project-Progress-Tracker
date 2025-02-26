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

// Update task status
router.patch('/tasks/:taskId/status', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { status: req.body.status },
      { new: true }
    ).populate('assignedTo', 'email');
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Error updating task status' });
  }
});

module.exports = router;