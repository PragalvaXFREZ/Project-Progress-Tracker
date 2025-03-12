import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './NavBar.css';

const NavBar = ({ userEmail, userRole }) => {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleDashboardClick = () => {
    const dashboardPath = userRole === 'admin' ? '/admin' : '/user';
    navigate(dashboardPath);
  };

  const handleReportClick = () => {
    if (projectId) {
      navigate(`/project/${projectId}/report`);
    } else {
      // If not in a project context, navigate to reports list
      navigate('/reports');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <span className="welcome-text">Welcome, {userEmail}</span>
      </div>
      <div className="navbar-right">
        <button onClick={handleDashboardClick}>Dashboard</button>
        <button onClick={() => navigate('/projects/archived')}>Archives</button>
        <button onClick={handleReportClick}>Project Reports</button>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
};

export default NavBar;