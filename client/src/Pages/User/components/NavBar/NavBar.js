import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NavBar.css';

const NavBar = ({ userEmail }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <span className="welcome-text">Welcome, {userEmail}</span>
      </div>
      <div className="navbar-right">
        <button onClick={() => navigate('/user')}>Projects</button>
        <button onClick={() => navigate('/user/tasks')}>Tasks</button>
        <button onClick={() => navigate('/user/task-report')}>Task Report</button>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
};

export default NavBar;