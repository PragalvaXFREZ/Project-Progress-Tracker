import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './components/NavBar/NavBar';  // Fixed import
import './UserDashboard.css';

const UserDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [userEmail, setUserEmail] = useState('');  // Added userEmail state
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch(`http://localhost:5000/api/projects/user/${userId}`);
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

    setUserEmail(email || 'User');  // Moved inside useEffect
    fetchProjects();
  }, [navigate]);

  const handleProjectSelect = (projectId) => {
    const selected = projects.find(project => project._id === projectId);
    setSelectedProject(selected);
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
              <p><strong>Created on:</strong> {new Date(selectedProject.date).toLocaleDateString()}</p>
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