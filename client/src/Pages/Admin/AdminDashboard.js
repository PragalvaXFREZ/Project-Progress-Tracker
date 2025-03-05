import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './Components/Nav Bar/NavBar';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    deadline: ''
  });
  const [newMember, setNewMember] = useState({
    projectId: '',
    email: ''
  });
  const [role, setRole] = useState('admin');

  // Add this after your state declarations
  const validateDeadline = (selectedDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    return selected >= today;
  };

  // Add useEffect to set userEmail
  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const isAdmin = localStorage.getItem('isAdmin');
    setUserEmail(email || 'Admin');
    setRole(isAdmin === 'true' ? 'admin' : 'user');
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      // Updated URL to match backend route
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

      console.log('Fetched projects:', data);

      const validProjects = Array.isArray(data)
        ? data.filter(project => project && project._id)
        : [];

      setProjects(validProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    }
  }, []); // Removed navigate from dependencies

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    if (!userId || !isAdmin) {
      alert('Please login as admin');
      navigate('/');
      return;
    }

    fetchProjects();
  }, [navigate, fetchProjects]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      if (!userId) {
        alert('User not authenticated');
        return;
      }

      if (!validateDeadline(newProject.deadline)) {
        alert('Please select a valid future date');
        return;
      }

      // Updated URL to match backend route
      const response = await fetch('http://localhost:5000/api/projects/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProject.name,
          description: newProject.description || '',
          deadline: new Date(newProject.deadline).toISOString(),
          createdBy: userId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create project');
      }

      const createdProject = data.project || data;
      setProjects(prevProjects => [...prevProjects, createdProject]);
      setNewProject({ name: '', description: '', deadline: '' });
      alert('Project created successfully');
    } catch (error) {
      console.error('Error creating project:', error);
      alert(error.message || 'Error creating project. Please try again.');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Updated URL to match backend route
      const response = await fetch(`http://localhost:5000/api/projects/${newMember.projectId}/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newMember.email
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add member');
      }

      const data = await response.json();

      setProjects(prevProjects =>
        prevProjects.map(project =>
          project._id === newMember.projectId ? data.project : project
        )
      );

      setNewMember({ projectId: '', email: '' });
      alert('Member added successfully');
    } catch (error) {
      console.error('Error adding member:', error);
      alert(error.message || 'Error adding member. Please try again.');
    }
  };

  return (
    <div>
      <NavBar userEmail={userEmail} userRole={role}/>
      <div className="admin-dashboard">
        <h2>Admin Dashboard</h2>

        <div className="create-project">
          <h3>Create New Project</h3>
          <form onSubmit={handleCreateProject}>
            <input
              type="text"
              placeholder="Project Name"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              required
            />
            <textarea
              placeholder="Project Description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            />
            <div className="date-input-container">
              <label>Project Deadline:</label>
              <input
                type="date"
                value={newProject.deadline}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  if (!validateDeadline(selectedDate)) {
                    alert('Please select a future date');
                    return;
                  }
                  setNewProject({ ...newProject, deadline: selectedDate });
                }}
                required
              />
            </div>
            <button type="submit">Create Project</button>
          </form>
        </div>

        <div className="add-member">
          <h3>Add Member to Project</h3>
          <form onSubmit={handleAddMember}>
            <select
              value={newMember.projectId}
              onChange={(e) => setNewMember({ ...newMember, projectId: e.target.value })}
              required
            >
              <option value="">Select Project</option>
              {Array.isArray(projects) && projects.map(project =>
                project && project._id ? (
                  <option key={project._id} value={project._id}>
                    {project.name || 'Unnamed Project'}
                  </option>
                ) : null
              )}
            </select>
            <input
              type="email"
              placeholder="Member Email"
              value={newMember.email}
              onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              required
            />
            <button type="submit">Add Member</button>
          </form>
        </div>
        <h3>Your Projects</h3>
        <div className="projects-list">
          
          {!Array.isArray(projects) || projects.length === 0 ? (
            <p>No projects found</p>
          ) : (
            projects.map(project =>
              project && project._id ? (
                <div
                  key={project._id}
                  className="project-card"
                  data-status={project.status}
                  onClick={() => navigate(`/admin/project/${project._id}/tasks`)}
                  style={{ cursor: 'pointer' }}
                >
                  <h4>{project.name || 'Unnamed Project'}</h4>
                  <p>{project.description || 'No description'}</p>
                  <p>Members: {project.members?.length || 0}</p>
                  <p>Status: {project.status}</p>
                  <p>Deadline: {project.deadline ? 
                    new Date(project.deadline).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'No deadline set'}
                  </p>
                </div>
              ) : null
            )
          )}
        </div>
        </div>
      </div>
    
  );
};

export default AdminDashboard;