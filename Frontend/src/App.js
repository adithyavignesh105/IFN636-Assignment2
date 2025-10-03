import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Register from "./components/Register";

// Root component configuring routes. Implements simple authentication check.
function App() {
  const [user, setUser] = useState(null);  // user object with role if logged in

  useEffect(() => {
    // On mount, check local storage for saved login
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = (userData, token) => {
    // Save user and token on login
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        {/* Public login route */}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        {/* Protected dashboard route */}
        <Route path="/dashboard" element={
          user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />
        } />
        {/* Default route */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;
