import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../Nav Bar/NavBar';
import './TaskManagement.css';

const TaskManagement = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  // State declarations
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

  // Fetch functions
  const fetchProjectDetails = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, projectDetails: true }));
      console.log('Fetching project details for ID:', projectId);
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`);
      const data = await response.json();
      
      if (response.ok) {
        setProjectDetails(data);
      } else {
        throw new Error(data.error || 'Failed to fetch project details');
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
      setError(error);
    } finally {
      setIsLoading(prev => ({ ...prev, projectDetails: false }));
    }
  }, [projectId]);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, tasks: true }));
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/tasks`);
      const data = await response.json();
      
      if (response.ok) {
        setTasks(data);
      } else {
        throw new Error(data.error || 'Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setIsLoading(prev => ({ ...prev, tasks: false }));
    }
  }, [projectId]);

  const fetchProjectMembers = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, members: true }));
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/members`);
      
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

  // Effect hooks
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

  // Validation function
  const validateTask = (task) => {
    if (!task.title.trim()) throw new Error('Title is required');
    if (!task.description.trim()) throw new Error('Description is required');
    if (!task.assignedTo) throw new Error('Please assign the task to a member');
    if (!task.deadline) throw new Error('Deadline is required');
    
    const deadlineDate = new Date(task.deadline);
    if (deadlineDate < new Date()) throw new Error('Deadline cannot be in the past');
  };

  // Handler functions
  const handleBack = () => {
    navigate('/admin');
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
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

      // First check if the response is not ok
      if (!response.ok) {
        // Only try to parse error response as JSON
        const errorData = await response.json().catch(() => ({
          error: 'Failed to delete project'
        }));
        throw new Error(errorData.error || 'Failed to delete project');
      }
      
      // If response is ok, don't try to parse it
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

  // Error boundary render
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

  // Main render
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
            <div className="project-details">
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

        {/* Delete Modal */}
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

        {/* Create Task Form */}
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

        {/* Tasks List */}
        <div className="tasks-list">
          <h3>Tasks</h3>
          {isLoading.tasks ? (
            <div className="loading">Loading tasks...</div>
          ) : tasks.length === 0 ? (
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