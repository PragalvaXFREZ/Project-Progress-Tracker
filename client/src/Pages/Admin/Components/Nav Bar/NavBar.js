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
        <button onClick={() => navigate('/user')}>Archives</button>
        <button onClick={() => navigate('/reports')}>Project Reports</button>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
};

export default NavBar;