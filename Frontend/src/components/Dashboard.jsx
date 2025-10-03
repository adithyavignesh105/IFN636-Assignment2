import React, { useEffect, useState } from 'react';
import EmployeeDashboard from './EmployeeDashboard';
import TeamLeadDashboard from './TeamLeadDashboard';
import ManagerDashboard from './ManagerDashboard';

// Main Dashboard component decides what to display based on user role
function Dashboard({ user, onLogout }) {
  // Example: fetch common data if needed (not used here for simplicity)
  const [welcomeMsg, setWelcomeMsg] = useState("");
  useEffect(() => {
    setWelcomeMsg(`Welcome ${user.name}! You are logged in as ${user.role}.`);
  }, [user]);

  return (
    <div className="dashboard">
      <header>
        <h1>Leave & Shift Management System</h1>
        <p>{welcomeMsg}</p>
        <button onClick={onLogout}>Logout</button>
      </header>

      {user.role === "Employee" && <EmployeeDashboard user={user} />}
      {user.role === "TeamLead" && <TeamLeadDashboard user={user} />}
      {user.role === "Manager" && <ManagerDashboard user={user} />}

      {/* The UI layout is built to match the prototypes (Week7) with clear separation of concerns per role. */}
    </div>
  );
}

export default Dashboard;
