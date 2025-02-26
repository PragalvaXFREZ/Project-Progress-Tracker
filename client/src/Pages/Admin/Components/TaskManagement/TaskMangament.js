import React, { useState, useEffect,useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../Nav Bar/NavBar';
import './TaskManagement.css';

const TaskManagement = () => {
  const { projectId } = useParams();
  const navigate = useNavigate(); // Add this
  const [tasks, setTasks] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [projectDetails, setProjectDetails] = useState(null); // Add this
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    deadline: '',
  });

 

  const fetchProjectDetails = useCallback(async () => {
    try {
      console.log('Fetching project details for ID:', projectId);
      // Updated URL to match the correct endpoint
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`);
      const data = await response.json();
      console.log('Project details response:', data);
      
      if (response.ok) {
        setProjectDetails(data);
      } else {
        throw new Error(data.error || 'Failed to fetch project details');
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
    }
  }, [projectId]);



  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/tasks`);
      const data = await response.json();
      if (response.ok) {
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, [projectId]);

  const fetchProjectMembers = useCallback(async () => {
  try {
    // Update the URL to match the router path
    const response = await fetch(`http://localhost:5000/api/project/${projectId}/members`);
    const data = await response.json();
    if (response.ok) {
      setProjectMembers(data.project.members); // Update to access members from the response
    }
  } catch (error) {
    console.error('Error fetching project members:', error);
  }
}, [projectId]);

useEffect(() => {
  fetchProjectDetails();
  fetchTasks();
  fetchProjectMembers();
}, [fetchProjectDetails, fetchTasks, fetchProjectMembers]);

  const handleBack = () => {
    navigate('/admin');
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks([...tasks, data]);
        setNewTask({
          title: '',
          description: '',
          assignedTo: '',
          deadline: '',
        });
        alert('Task created successfully');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    }
  };

  return (
    <div>
      <NavBar userEmail={localStorage.getItem('userEmail')} />
      <div className="task-management">
        <h2>Task Management</h2>
        <div className="task-management-header">
          <button onClick={handleBack} className="back-button">
            ← Back to Dashboard
          </button>
          {!projectDetails ? (
            <div className="loading">Loading project details...</div>
          ) : (
            <div className="project-details">
              <h2>{projectDetails.name || 'Unnamed Project'}</h2>
              <p className="project-description">{projectDetails.description || 'No description available'}</p>
              <div className="project-meta">
                <p>Total Members: {projectDetails.members?.length || 0}</p>
                <p>Created by: {projectDetails.createdBy?.email || 'Unknown'}</p>
                <p>Created: {new Date(projectDetails.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>
        <div className="create-task">
          <h3>Create New Task</h3>
          <form onSubmit={handleCreateTask}>
            <input
              type="text"
              placeholder="Task Title"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              required
            />
            <textarea
              placeholder="Task Description"
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              required
            />
             <select
                value={newTask.assignedTo}
                onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                required
              >
                <option value="">Assign To</option>
                {Array.isArray(projectMembers) && projectMembers.map(member => (
                  <option key={member._id} value={member._id}>
                    {member.email}
                  </option>
                ))}
              </select>
            <input
              type="datetime-local"
              value={newTask.deadline}
              onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
              required
            />
            <button type="submit">Create Task</button>
          </form>
        </div>

        <div className="tasks-list">
          <h3>Tasks</h3>
          {tasks.length === 0 ? (
            <p>No tasks found</p>
          ) : (
            <div className="tasks-grid">
              {tasks.map(task => (
                <div key={task._id} className="task-card">
                  <h4>{task.title}</h4>
                  <p>{task.description}</p>
                  <p>Assigned to: {task.assignedTo.email}</p>
                  <p>Deadline: {new Date(task.deadline).toLocaleString()}</p>
                  <p>Status: {task.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskManagement;