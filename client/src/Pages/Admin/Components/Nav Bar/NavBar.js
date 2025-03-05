import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NavBar.css';

const NavBar = ({ userEmail, userRole }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleDashboardClick = () => {
    const dashboardPath = userRole === 'admin' ? '/admin' : '/user';
    navigate(dashboardPath);
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <span className="welcome-text">Welcome, {userEmail}</span>
      </div>
      <div className="navbar-right">
        <button onClick={handleDashboardClick}>Dashboard</button>
        <button onClick={() => navigate('/projects/archived')}>Archives</button>
        <button onClick={() => navigate('/reports')}>Project Reports</button>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
};

export default NavBar;