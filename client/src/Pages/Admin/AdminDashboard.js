import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();
  const [newProject, setNewProject] = useState({
    name: '',
    description: ''
  });
  const [newMember, setNewMember] = useState({
    projectId: '',
    email: ''
  });

  const fetchProjects = useCallback(async () => {
    try {
      const userId = localStorage.getItem('userId');
      const isAdmin = localStorage.getItem('isAdmin') === 'true';
      
      if (!isAdmin) {
        alert('Unauthorized access');
        navigate('/');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/projects/user/${userId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch projects');
      }
      
      // Ensure each project has required fields
      const validProjects = Array.isArray(data)
        ? data.filter(project => project && project._id && project.name)
        : [];
      
      setProjects(validProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    }
  }, [navigate]);

  // Replace the existing useEffect with this one, including fetchProjects as dependency
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

  useEffect(() => {
    console.log('Current projects:', projects);
  }, [projects]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('User not authenticated');
        return;
      }
  
      console.log('Sending project data:', {
        name: newProject.name,
        description: newProject.description,
        createdBy: userId
      });
  
      const response = await fetch('http://localhost:5000/api/projects/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newProject.name,
          description: newProject.description || '',
          createdBy: userId
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        // Fallback to data.message if data.error is undefined.
        throw new Error(data.error || data.message || 'Failed to create project');
      }
  
      // Some backends return the project under a "project" key,
      // but others return it directly.
      const createdProject = data.project || data;
      setProjects([...projects, createdProject]);
      setNewProject({ name: '', description: '' });
      alert('Project created successfully');
    } catch (error) {
      console.error('Error creating project:', error);
      alert(error.message || 'Error creating project. Please try again.');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${newMember.projectId}/members`, {
        method: 'POST',
        headers: {
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
      
      // Update the specific project while keeping its position in the array
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
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      
      <div className="create-project">
        <h3>Create New Project</h3>
        <form onSubmit={handleCreateProject}>
          <input
            type="text"
            placeholder="Project Name"
            value={newProject.name}
            onChange={(e) => setNewProject({...newProject, name: e.target.value})}
            required
          />
          <textarea
            placeholder="Project Description"
            value={newProject.description}
            onChange={(e) => setNewProject({...newProject, description: e.target.value})}
          />
          <button type="submit">Create Project</button>
        </form>
      </div>

      <div className="add-member">
        <h3>Add Member to Project</h3>
        <form onSubmit={handleAddMember}>
          <select
            value={newMember.projectId}
            onChange={(e) => setNewMember({...newMember, projectId: e.target.value})}
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
            onChange={(e) => setNewMember({...newMember, email: e.target.value})}
            required
          />
          <button type="submit">Add Member</button>
        </form>
      </div>

      <div className="projects-list">
        <h3>Your Projects</h3>
        {!Array.isArray(projects) || projects.length === 0 ? (
          <p>No projects found</p>
        ) : (
          projects.map(project => 
            project && project._id ? (
              <div key={project._id} className="project-card">
                <h4>{project.name || 'Unnamed Project'}</h4>
                <p>{project.description || 'No description'}</p>
                <p>Members: {project.members?.length || 0}</p>
              </div>
            ) : null
          )
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;