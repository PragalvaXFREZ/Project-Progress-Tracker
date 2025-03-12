import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../Admin/Components/Nav Bar/NavBar';
import './projectReport.css';

const ProjectReport = () => {
  const [report, setReport] = useState(null);
  const [reports, setReports] = useState([]); // Add this for all reports
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { projectId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Determine which endpoint to use based on projectId
        const url = projectId 
          ? `http://localhost:5000/api/projects/${projectId}/report`
          : 'http://localhost:5000/api/projects/reports';

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch report(s)');
        }

        const data = await response.json();
        
        // Set the appropriate state based on projectId
        if (projectId) {
          setReport(data);
        } else {
          setReports(data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]); // Add projectId to dependency array

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  // Show reports list if no projectId
  if (!projectId) {
    return (
      <div>
        <NavBar userEmail={localStorage.getItem('userEmail')} />
        <div className="project-report">
          <h1>Project Reports</h1>
          <div className="reports-grid">
            {reports.map(report => (
              <div 
                key={report._id}
                className="report-card clickable"
                onClick={() => navigate(`/project/${report._id}/report`)}
              >
                <h3>{report.name}</h3>
                <div className="metrics-summary">
                  <div className="metric-item">
                    <span className="metric-value">{report.metrics.completionRate}%</span>
                    <span className="metric-label">Complete</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-value">{report.metrics.pending}</span>
                    <span className="metric-label">Pending</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-value">{report.metrics.overdue}</span>
                    <span className="metric-label">Overdue</span>
                  </div>
                </div>
                <div className="report-meta">
                  <span className={`status-badge ${report.status}`}>
                    {report.status}
                  </span>
                  {report.isOverdue && 
                    <span className="overdue-warning">Overdue!</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Check if report data exists before rendering single project report
  if (!report) return <div className="loading">Loading project report...</div>;

  // Show single project report (existing detailed view)
  return (
    <div>
      <NavBar userEmail={localStorage.getItem('userEmail')} />
      <div className="project-report">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>
        
        <div className="report-header">
          <h1>{report.projectDetails.name} - Project Report</h1>
          <p className="project-description">{report.projectDetails.description}</p>
        </div>

        <div className="report-grid">
          <div className="report-card project-overview">
            <h2>Project Overview</h2>
            <div className="overview-details">
              <p>Status: <span className={`status-badge ${report.projectDetails.status}`}>
                {report.projectDetails.status}
              </span></p>
              <p>Created by: {report.projectDetails.createdBy}</p>
              <p>Created: {new Date(report.projectDetails.createdAt).toLocaleDateString()}</p>
              <p>Days Remaining: {report.projectDuration.daysRemaining}</p>
              {report.projectDuration.isOverdue && 
                <p className="overdue-warning">Project is overdue!</p>
              }
            </div>
          </div>

          <div className="report-card completion-metrics">
            <h2>Task Completion Metrics</h2>
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-value">{report.taskMetrics.total}</span>
                <span className="metric-label">Total Tasks</span>
              </div>
              <div className="metric-item">
                <span className="metric-value">{report.taskMetrics.completed}</span>
                <span className="metric-label">Completed</span>
              </div>
              <div className="metric-item">
                <span className="metric-value">{report.taskMetrics.pending}</span>
                <span className="metric-label">Pending</span>
              </div>
              <div className="metric-item overdue">
                <span className="metric-value">{report.taskMetrics.overdue}</span>
                <span className="metric-label">Overdue</span>
              </div>
            </div>
            <div className="completion-rate">
              <h3>Overall Completion Rate</h3>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${report.taskMetrics.completionRate}%` }}
                />
                <span className="completion-percentage">
                  {report.taskMetrics.completionRate}%
                </span>
              </div>
            </div>
          </div>

          <div className="report-card member-performance">
            <h2>Team Performance</h2>
            <div className="member-stats">
              {report.memberStats.map((member, index) => (
                <div key={index} className="member-stat-card">
                  <h3>{member.email}</h3>
                  <div className="member-metrics">
                    <div className="metric">
                      <span className="metric-value">{member.totalAssigned}</span>
                      <span className="metric-label">Assigned</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">{member.completed}</span>
                      <span className="metric-label">Completed</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">{member.overdue}</span>
                      <span className="metric-label">Overdue</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="report-card task-distribution">
            <h2>Task Status Distribution</h2>
            <div className="status-grid">
              <div className="status-item pending">
                <span className="status-count">{report.taskStatus.pending}</span>
                <span className="status-label">Pending</span>
              </div>
              <div className="status-item in-progress">
                <span className="status-count">{report.taskStatus.inProgress}</span>
                <span className="status-label">In Progress</span>
              </div>
              <div className="status-item completed">
                <span className="status-count">{report.taskStatus.completed}</span>
                <span className="status-label">Completed</span>
              </div>
              <div className="status-item accepted">
                <span className="status-count">{report.taskStatus.accepted}</span>
                <span className="status-label">Accepted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectReport;