import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './components/NavBar/NavBar';
import './UserDashboard.css';

const UserDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [setError] = useState(null);
  const navigate = useNavigate();


  //fetching the projects
  const fetchProjects = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:5000/api/projects/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch projects');
      }

      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    }
  };

  //fetching the tasks
  const fetchTasks = async (projectId) => {
    try {
      setIsLoading(true);
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      console.log('Fetching tasks for project:', projectId, 'and user:', userId);
      
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}/tasks/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      console.log('Tasks response:', data);
      
      if (response.ok) {
        setTasks(Array.isArray(data) ? data : []);
      } else {
        throw new Error(data.error || 'Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const email = localStorage.getItem('userEmail');
    
    if (!userId) {
      alert('Please login first');
      navigate('/');
      return;
    }

    if (isAdmin) {
      navigate('/admin');
      return;
    }

    setUserEmail(email || 'User');
    fetchProjects();
  }, [navigate]);

  const handleProjectSelect = (projectId) => {
    const selected = projects.find(project => project._id === projectId);
    setSelectedProject(selected);
    if (projectId) {
      fetchTasks(projectId);
    } else {
      setTasks([]);
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'Project is completed') {
          alert('This project has been marked as complete. Task status cannot be changed.');
          return;
        }
        throw new Error(data.error || 'Failed to update task status');
      }

      setTasks(tasks.map(task => 
        task._id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error('Error updating task status:', error);
      setError(error.message);
    }
  };

  return (
    <div>
      <NavBar userEmail={userEmail} />
      <div className="user-dashboard">
        <h2>User Dashboard</h2>
        
        <div className="project-selector">
          <h3>Your Projects</h3>
          <select 
            value={selectedProject?._id || ''}
            onChange={(e) => handleProjectSelect(e.target.value)}
          >
            <option value="">Select a project</option>
            {projects.map(project => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {selectedProject && (
          <div className="project-details">
            <h3>{selectedProject.name}</h3>
            <div className="project-info">
              <p><strong>Description:</strong> {selectedProject.description || 'No description available'}</p>
              <p><strong>Created by:</strong> {selectedProject.createdBy?.email || 'Unknown'}</p>
              <p><strong>Total Members:</strong> {selectedProject.members?.length || 0}</p>
              <p><strong>Created on:</strong> {new Date(selectedProject.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="project-tasks">
              <h3>Your Tasks</h3>
              {isLoading ? (
                <p>Loading tasks...</p>
              ) : tasks.length === 0 ? (
                <p>No tasks assigned to you in this project.</p>
              ) : (
                <div className="tasks-grid">
                  {tasks.map(task => (
                    <div 
                      key={task._id} 
                      className={`task-card ${selectedProject?.status === 'completed' ? 'locked' : ''}`} 
                      data-status={task.status}
                    >
                      <h4>{task.title}</h4>
                      <p>{task.description}</p>
                      <p><strong>Deadline:</strong> {new Date(task.deadline).toLocaleDateString()}</p>
                      <div className="task-status">
                        <label>Status: </label>
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusUpdate(task._id, e.target.value)}
                          disabled={selectedProject?.status === 'completed'}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      {selectedProject?.status === 'completed' && (
                        <div className="locked-badge">
                          <span>🔒 Project Completed</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {projects.length === 0 && (
          <p className="no-projects">You are not a member of any projects yet.</p>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;