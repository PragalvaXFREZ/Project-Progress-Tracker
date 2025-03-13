import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Archives.css';
import NavBar from '../Admin/Components/Nav Bar/NavBar';

const Archives = () => {
  const [archivedProjects, setArchivedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [role, setRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const initializeComponent = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        const email = localStorage.getItem('userEmail');
        const isAdmin = localStorage.getItem('isAdmin');

        if (!token || !userId) {
          console.error('Missing authentication data');
          navigate('/');
          return;
        }

        if (isMounted) {
          setUserEmail(email || 'User');
          setRole(isAdmin === 'true' ? 'admin' : 'user');
        }

        // Updated URL to include userId for filtering
        const response = await fetch(`http://localhost:5000/api/projects/archived/user/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.clear();
            navigate('/');
            return;
          }
          throw new Error('Failed to fetch archived projects');
        }

        const data = await response.json();
        
        if (isMounted) {
          setArchivedProjects(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error:', err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    initializeComponent();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleDeleteProject = async (projectId, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to permanently delete this archived project?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }

      setArchivedProjects(prevProjects => 
        prevProjects.filter(project => project._id !== projectId)
      );
      alert('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert(error.message || 'Error deleting project. Please try again.');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      <NavBar userEmail={userEmail} userRole={role} />
      <div className="archives-container">
        <h2>Archived Projects</h2>
        <div className="archived-projects-grid">
          {archivedProjects.length === 0 ? (
            <p>No archived projects found.</p>
          ) : (
            archivedProjects.map((project) => (
              <div key={project._id} className="archived-project-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <h3>{project.name}</h3>
                  {role === 'admin' && (
                    <button
                      onClick={(e) => handleDeleteProject(project._id, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'red',
                        fontSize: '1.2em',
                        padding: '5px'
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
                <p>Description: {project.description}</p>
                <p>Status: {project.status}</p>
                <p>Deadline: {new Date(project.deadline).toLocaleDateString()}</p>
                <p>Created: {new Date(project.createdAt).toLocaleDateString()}</p>
                <p>Members: {project.members.length}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Archives;