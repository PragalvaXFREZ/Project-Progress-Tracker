import React from 'react';
import './TaskTimings.css';

const TaskTimings = ({ averageMetrics }) => {
  // Add console log to check incoming data
  console.log('Average Metrics:', averageMetrics);

  // Add null check for averageMetrics
  if (!averageMetrics) {
    return (
      <div className="report-card task-timings">
        <h2>Task Timing Analysis</h2>
        <p>No timing data available</p>
      </div>
    );
  }

  return (
    <div className="report-card task-timings">
      <h2>Task Timing Analysis</h2>
      <div className="timing-metrics">
        <div className="timing-metric">
          <div className="metric-icon user-work">🔄</div>
          <div className="metric-details">
            <h3>Time to Submit for Review</h3>
            <p>Average time users take to complete work</p>
            <span className="metric-value">
              {averageMetrics?.averageTimeToReview || 'N/A'}
            </span>
          </div>
        </div>

        <div className="timing-metric">
          <div className="metric-icon admin-review">⚡</div>
          <div className="metric-details">
            <h3>Admin Response Time</h3>
            <p>Average time for admin to review work</p>
            <span className="metric-value">
              {averageMetrics?.averageAdminResponseTime || 'N/A'}
            </span>
          </div>
        </div>

        <div className="timing-metric">
          <div className="metric-icon total-time">🎯</div>
          <div className="metric-details">
            <h3>Total Completion Time</h3>
            <p>Average time from assignment to completion</p>
            <span className="metric-value">
              {averageMetrics?.averageTotalCompletionTime || 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskTimings;