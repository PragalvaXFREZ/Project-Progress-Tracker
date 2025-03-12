import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../Nav Bar/NavBar';
import './TaskManagement.css';

const TaskManagement = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [projectDetails, setProjectDetails] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState({
    projectDetails: false,
    tasks: false,
    members: false
  });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    deadline: '',
  });
  const [projectStatus, setProjectStatus] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Add this validation function after your state declarations
  const validateTaskDeadline = (taskDeadline) => {
    const projectDeadline = new Date(projectDetails?.deadline);
    const selectedDeadline = new Date(taskDeadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    if (selectedDeadline < today) {
      alert('Task deadline cannot be in the past');
      return false;
    }
  
    if (selectedDeadline > projectDeadline) {
      alert('Task deadline cannot exceed project deadline');
      return false;
    }
  
    return true;
  };

  // Add this function after your state declarations
  const calculateProjectProgress = useCallback(() => {
    if (!tasks || tasks.length === 0) {
      return 0; // Initial phase
    }
  
    const completedTasks = tasks.filter(task => task.status === 'completed' || task.status === 'accepted').length;
    const totalTasks = tasks.length;
    
    return Math.round((completedTasks / totalTasks) * 100);
  }, [tasks]);

  // Fetch functions
  const fetchProjectDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        navigate('/');
        return;
      }

      setIsLoading(prev => ({ ...prev, projectDetails: true }));
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch project details');
      }
      
      const data = await response.json();
      setProjectDetails(data);
    } catch (error) {
      console.error('Error fetching project details:', error);
      if (error.message.includes('auth')) {
        navigate('/');
      }
      setError(error);
    } finally {
      setIsLoading(prev => ({ ...prev, projectDetails: false }));
    }
  }, [projectId, navigate]);

  const fetchTasks = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      setIsLoading(prev => ({ ...prev, tasks: true }));
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setIsLoading(prev => ({ ...prev, tasks: false }));
    }
  }, [projectId]);

  const fetchProjectMembers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      setIsLoading(prev => ({ ...prev, members: true }));
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setProjectMembers(data);
    } catch (error) {
      console.error('Error fetching project members:', error);
      setProjectMembers([]);
    } finally {
      setIsLoading(prev => ({ ...prev, members: false }));
    }
  }, [projectId]);

 
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        if (mounted) {
          await Promise.all([
            fetchProjectDetails(),
            fetchTasks(),
            fetchProjectMembers()
          ]);
        }
      } catch (error) {
        if (mounted) {
          console.error('Error fetching data:', error);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [fetchProjectDetails, fetchTasks, fetchProjectMembers]);

  
  const validateTask = (task) => {
    if (!task.title.trim()) throw new Error('Title is required');
    if (!task.description.trim()) throw new Error('Description is required');
    if (!task.assignedTo) throw new Error('Please assign the task to a member');
    if (!task.deadline) throw new Error('Deadline is required');
    
    const deadlineDate = new Date(task.deadline);
    if (deadlineDate < new Date()) throw new Error('Deadline cannot be in the past');
  };

  
  const handleBack = () => {
    navigate('/admin');
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      if (!validateTaskDeadline(newTask.deadline)) {
        return;
      }
      validateTask(newTask);
      
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      });

      const data = await response.json();

      if (response.ok) {
        setTasks([...tasks, data]);
        setNewTask({
          title: '',
          description: '',
          assignedTo: '',
          deadline: '',
        });
        alert('Task created successfully');
      } else {
        throw new Error(data.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task: ' + error.message);
    }
  };

  const handleDeleteProject = async () => {
    try {
      if (deleteConfirmation !== projectDetails?.name) {
        alert("Project name doesn't match");
        return;
      }

      console.log('Attempting to delete project:', projectId);
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
    
        const errorData = await response.json().catch(() => ({
          error: 'Failed to delete project'
        }));
        throw new Error(errorData.error || 'Failed to delete project');
      }
      
      alert('Project deleted successfully');
      navigate('/admin');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert(`Failed to delete project: ${error.message}`);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update project status');
      }
  
      const updatedProject = await response.json();
      setProjectDetails(updatedProject);
      setProjectStatus(updatedProject.status);
    } catch (error) {
      console.error('Error updating project status:', error);
      alert('Failed to update project status');
    }
  };

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'completed') {
      setShowCompleteModal(true);
    } else {
      handleStatusUpdate(newStatus);
    }
  };

  const handleProjectCompletion = async (confirm) => {
    if (confirm) {
      await handleStatusUpdate('completed');
    }
    setShowCompleteModal(false);
  };

  if (error) {
    return (
      <div className="error-container">
        <h2>Something went wrong</h2>
        <p>{error.message}</p>
        <button onClick={() => {
          setError(null);
          navigate('/admin');
        }}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      <NavBar userEmail={localStorage.getItem('userEmail')} />
      <div className="task-management">
        <h2>Manage Your Project</h2>
        <div className="task-management-header">
          <button onClick={handleBack} className="back-button">
            ← Back to Dashboard
          </button>
          {isLoading.projectDetails ? (
            <div className="loading">Loading project details...</div>
          ) : (
            <div className="project-details" data-status={projectDetails?.status || 'pending'}>
              <h2>{projectDetails?.name || 'Unnamed Project'}</h2>
              <p className="project-description">
                {projectDetails?.description || 'No description available'}
              </p>
              <div className="project-meta">
                <p>Total Members: {projectDetails?.members?.length || 0}</p>
                <p>Created by: {projectDetails?.createdBy?.email || 'Unknown'}</p>
                <p>Created: {projectDetails?.createdAt ? 
                    new Date(projectDetails.createdAt).toLocaleDateString() : 
                    'Unknown date'}
                </p>
              </div>
              
              <div className="project-status">
                <h4>Project Status: {projectDetails?.status}</h4>
                {projectDetails?.status !== 'completed' && (
                  <select
                    value={projectStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="status-select"
                  >
                    <option value="">Change Status</option>
                    <option value="pending">Pending</option>
                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                )}
              </div>
              <div className="project-actions">
                <button 
                  className="delete-project-btn"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete Project
                </button>
              </div>
            </div>
          )}
        </div>

        {showDeleteModal && (
          <div className="delete-modal">
            <div className="delete-modal-content">
              <h3>Delete Project</h3>
              <p>This action cannot be undone. Please type <strong>{projectDetails?.name}</strong> to confirm.</p>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type project name to confirm"
              />
              <div className="delete-modal-actions">
                <button
                  className="delete-confirm-btn"
                  onClick={handleDeleteProject}
                  disabled={deleteConfirmation !== projectDetails?.name}
                >
                  Delete Project
                </button>
                <button
                  className="delete-cancel-btn"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="project-statistics">
          <h3>Project Statistics</h3>
          <div className="stats-grid">
            <div className="stats-card progress-card">
              <h4>Overall Progress</h4>
              <div className="progress-info">
                <span className="progress-percentage">{calculateProjectProgress()}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${calculateProjectProgress()}%`,
                    backgroundColor: calculateProjectProgress() === 100 ? '#10b981' : '#4361ee'
                  }}
                />
              </div>
              <p className="progress-status">
                {tasks.length === 0 
                  ? "Initial Phase - No tasks created yet"
                  : calculateProjectProgress() === 100
                  ? "All tasks completed!"
                  : `${tasks.filter(task => task.status === 'completed' || task.status === 'accepted').length} of ${tasks.length} tasks completed`
                }
              </p>
            </div>

            <div className="stats-card">
              <h4>Task Status</h4>
              <div className="task-stats">
                <div className="stat-item">
                  <span className="stat-label">Active Tasks</span>
                  <span className="stat-value">
                    {tasks.filter(task => task.status === 'pending' || task.status === 'in-progress').length}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Completed Tasks</span>
                  <span className="stat-value">
                    {tasks.filter(task => task.status === 'completed' || task.status === 'accepted').length}
                  </span>
                </div>
                <div className="stat-item overdue">
                  <span className="stat-label">Overdue Tasks</span>
                  <span className="stat-value">
                    {tasks.filter(task => new Date(task.deadline) < new Date() && task.status !== 'completed').length}
                  </span>
                </div>
              </div>
            </div>

            <div className="stats-card">
              <h4>Team Members</h4>
              <div className="members-list">
                {projectMembers
                  .filter(member => member._id !== projectDetails?.createdBy?._id)
                  .map(member => (
                    <div key={member._id} className="member-item">
                      <span className="member-email">{member.email}</span>
                      <div className="member-tasks">
                        <span className="assigned-tasks">
                          Assigned: {tasks.filter(task => task.assignedTo._id === member._id).length}
                        </span>
                        <span className="completed-tasks">
                          Completed: {tasks.filter(task => task.assignedTo._id === member._id && 
                            (task.status === 'completed' || task.status === 'accepted')).length}
                        </span>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </div>
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
              {Array.isArray(projectMembers) && projectMembers
                .filter(member => member._id !== projectDetails?.createdBy?._id)
                .map(member => (
                  <option key={member._id} value={member._id}>
                    {member.email}
                  </option>
                ))}
            </select>
            <div className="date-input-container">
              <label>Task Deadline:</label>
              <input
                type="datetime-local"
                value={newTask.deadline}
                min={new Date().toISOString().slice(0, 16)}
                max={projectDetails?.deadline ? new Date(projectDetails.deadline).toISOString().slice(0, 16) : undefined}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  if (validateTaskDeadline(selectedDate)) {
                    setNewTask({...newTask, deadline: selectedDate});
                  }
                }}
                required
              />
            </div>
            <button type="submit">Create Task</button>
          </form>
        </div>

        <div className="tasks-list">
          <h3>Tasks</h3>
          {isLoading.tasks ? (
            <div className="loading">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <p>No tasks found</p>
          ) : (
            <div className="tasks-grid">
              {tasks.map(task => (
                <div 
                  key={task._id} 
                  className={`task-card ${task.isLocked ? 'locked' : ''}`}
                  data-status={task.status}
                  data-overdue={new Date(task.deadline) < new Date() && task.status !== 'completed'}
                >
                  <h4>{task.title}</h4>
                  <p className="task-description">{task.description}</p>
                  <div className="task-meta">
                    <p>
                      <span className="meta-label">Assigned to:</span> 
                      {task.assignedTo.email}
                    </p>
                    <p>
                      <span className="meta-label">Deadline:</span> 
                      <span className="deadline-text">
                        {new Date(task.deadline).toLocaleString()}
                      </span>
                    </p>
                    <p>
                      <span className="meta-label">Status:</span> 
                      <span className={`status-badge ${task.status}`}>
                        {task.status}
                      </span>
                    </p>
                  </div>
                  {task.isLocked && (
                    <div className="locked-badge">
                      <span>🔒 Project Completed</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {showCompleteModal && (
          <div className="completion-modal">
            <div className="completion-modal-content">
              <h3>Complete Project</h3>
              <p>Are you sure this project is complete?</p>
              <div className="completion-modal-actions">
                <button
                  className="complete-confirm-btn"
                  onClick={() => handleProjectCompletion(true)}
                >
                  Yes, Complete Project
                </button>
                <button
                  className="complete-cancel-btn"
                  onClick={() => handleProjectCompletion(false)}
                >
                  No, Keep in Progress
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManagement;