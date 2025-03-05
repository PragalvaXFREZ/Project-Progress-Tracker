import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginSignup from './Pages/LoginSignup/LoginSignup';
import AdminDashboard from './Pages/Admin/AdminDashboard';
import UserDashboard from './Pages/User/UserDashboard';
import TaskManagement from './Pages/Admin/Components/TaskManagement/TaskMangament';
import Archives from './Pages/Archives/Archives';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginSignup />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/admin/project/:projectId/tasks" element={<TaskManagement />} />
        <Route path="/projects/archived" element={<Archives />} />
      </Routes> 
    </Router>
  );
}

export default App;