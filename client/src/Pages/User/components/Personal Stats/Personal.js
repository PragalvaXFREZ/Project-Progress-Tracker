import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Personal.css';

const Personal = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        
        if (!userId || !token) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`http://localhost:5000/api/users/${userId}/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user statistics');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  if (loading) {
    return <div className="stats-loading">Loading your statistics...</div>;
  }

  if (error) {
    return <div className="stats-error">Error: {error}</div>;
  }

  return (
    <div className="personal-stats-container">
      <div className="stats-header">
        <h2>Your Performance Dashboard</h2>
        <p>Track your progress across all projects</p>
      </div>

      <div className="stats-summary">
        <div className="stat-card total-projects">
          <div className="stat-icon">📊</div>
          <div className="stat-data">
            <span className="stat-value">{stats.totalProjects}</span>
            <span className="stat-label">Projects</span>
          </div>
        </div>
        
        <div className="stat-card completed-projects">
          <div className="stat-icon">✅</div>
          <div className="stat-data">
            <span className="stat-value">{stats.completedProjects}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
        
        <div className="stat-card total-tasks">
          <div className="stat-icon">📝</div>
          <div className="stat-data">
            <span className="stat-value">{stats.totalTasks}</span>
            <span className="stat-label">Tasks</span>
          </div>
        </div>
        
        <div className="stat-card completion-rate">
          <div className="stat-icon">🏆</div>
          <div className="stat-data">
            <span className="stat-value">{stats.completionRate}%</span>
            <span className="stat-label">Completion Rate</span>
          </div>
        </div>
      </div>

      <div className="stats-sections">
        <div className="project-activity">
          <h3>Project Activity</h3>
          <div className="timeline">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-date">
                  {new Date(activity.date).toLocaleDateString()}
                </div>
                <div className="timeline-content">
                  <div className="timeline-project">{activity.projectName}</div>
                  <div className="timeline-action">{activity.action}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="task-status-distribution">
          <h3>Your Tasks by Status</h3>
          <div className="status-distribution">
            <div className="status-item">
              <div className="status-bar">
                <div 
                  className="status-fill pending" 
                  style={{width: `${stats.taskDistribution.pending}%`}}
                ></div>
              </div>
              <div className="status-label">
                <span>Pending</span>
                <span>{stats.taskDistribution.pending}%</span>
              </div>
            </div>
            
            <div className="status-item">
              <div className="status-bar">
                <div 
                  className="status-fill in-progress" 
                  style={{width: `${stats.taskDistribution.inProgress}%`}}
                ></div>
              </div>
              <div className="status-label">
                <span>In Progress</span>
                <span>{stats.taskDistribution.inProgress}%</span>
              </div>
            </div>
            
            <div className="status-item">
              <div className="status-bar">
                <div 
                  className="status-fill review" 
                  style={{width: `${stats.taskDistribution.review}%`}}
                ></div>
              </div>
              <div className="status-label">
                <span>Review</span>
                <span>{stats.taskDistribution.review}%</span>
              </div>
            </div>
            
            <div className="status-item">
              <div className="status-bar">
                <div 
                  className="status-fill completed" 
                  style={{width: `${stats.taskDistribution.completed}%`}}
                ></div>
              </div>
              <div className="status-label">
                <span>Completed</span>
                <span>{stats.taskDistribution.completed}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="projects-overview">
        <h3>Your Projects</h3>
        <div className="projects-grid">
          {stats.projects.map(project => (
            <div key={project._id} className="project-stat-card" onClick={() => navigate(`/project/${project._id}`)}>
              <h4>{project.name}</h4>
              <div className="project-stat-metrics">
                <div className="project-progress">
                  <div className="progress-circle" style={{"--percentage": `${project.completionPercentage}%`}}>
                    <div className="progress-circle-inner">
                      <span>{project.completionPercentage}%</span>
                    </div>
                  </div>
                </div>
                <div className="project-stat-details">
                  <div className="detail-item">
                    <span className="detail-label">Tasks</span>
                    <span className="detail-value">{project.totalTasks}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Completed</span>
                    <span className="detail-value">{project.completedTasks}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Deadline</span>
                    <span className="detail-value">{new Date(project.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="project-stat-status">
                <span className={`status-badge ${project.status}`}>{project.status}</span>
                {project.isOverdue && <span className="overdue-badge">Overdue</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Personal;