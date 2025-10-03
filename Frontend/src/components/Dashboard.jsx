import React, { useEffect, useState } from 'react';
import EmployeeDashboard from './EmployeeDashboard';
import TeamLeadDashboard from './TeamLeadDashboard';
import ManagerDashboard from './ManagerDashboard';


function DashboardHeader({ welcomeMsg, onLogout }) {
  return (
    <header>
      <h1>Leave & Shift Management System</h1>
      <p>{welcomeMsg}</p>
      <button onClick={onLogout}>Logout</button>
    </header>
  );
}


function Dashboard({ user, onLogout }) {
  const [welcomeMsg, setWelcomeMsg] = useState("");

  useEffect(() => {
    setWelcomeMsg(`Welcome ${user.name}! You are logged in as ${user.role}.`);
  }, [user]);

  return (
    <div className="dashboard">
      {/* Reusable Header */}
      <DashboardHeader welcomeMsg={welcomeMsg} onLogout={onLogout} />

      {/* Role-based Dashboards */}
      {user.role === "Employee" && <EmployeeDashboard user={user} />}
      {user.role === "TeamLead" && <TeamLeadDashboard user={user} />}
      {user.role === "Manager" && <ManagerDashboard user={user} />}
    </div>
  );
}

export default Dashboard;
