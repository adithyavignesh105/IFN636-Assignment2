import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

function Login({ onLogin }) {
  const navigate = useNavigate(); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const handleSubmit = async (e) => {
    e.preventDefault();  // prevent page refresh on form submit
    setErrorMsg("");     // reset any previous error
    const base = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
    let payload;
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password }),
        // credentials: "include"  // uncomment if using cookies for JWT
      });
      console.log(res)
      const ct = res.headers.get("content-type") || "";
      payload = ct.includes("application/json")
        ? await res.json()
        : { message: await res.text() };

      // Optional debugging (safe because payload is defined now)
      console.log("[login] status:", res.status, "| payload:", payload);
      if (!res.ok) {
        // If HTTP status is not 200-299, handle error
        const errorData = await res.json().catch(() => ({}));
        const message = errorData.error || errorData.message || "Failed to login.";
        setErrorMsg(message);
        return;
      }
      onLogin(payload.user, payload.token);
      navigate("/dashboard", { replace: true });
      // Parse successful response
      const data = await res.json();
      // TODO: handle successful login (e.g., save token, redirect)
      console.log("Login successful!", data);
    } catch (err) {
      // Handle network or parsing errors
      console.error("Network error:", err);
      setErrorMsg("Unable to connect to the server. Please try again.");
    }
  };

  return (

    <div className="container min-vh-100 d-flex align-items-center justify-content-center">
      <div className="col-11 col-sm-9 col-md-7 col-lg-5">
        <div className="card shadow-sm p-4 fade-in-down">
          <h2 className="text-center mb-3">Login</h2>
          <form onSubmit={handleSubmit} className="needs-validation" noValidate>
           <div className="mb-3">
  <label className="form-label">Email</label>
  <input
    type="email"
    className="form-control"
    id="loginEmail"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="Enter your email"
    required
  />
</div>

<div className="mb-3">
  <label className="form-label">Password</label>
  <input
    type="password"
    className="form-control"
    id="loginPassword"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="Enter your password"
    required
  />
</div>
            <button type="submit" className="btn btn-primary w-100">Login</button>
            {errorMsg && <p className="alert alert-danger mt-3 mb-0">{errorMsg}</p>}
          </form>
          <p className="text-center mt-3 mb-0">
            Don’t have an account? <Link to="/register" className="fw-semibold">Register</Link>
          </p>
        </div>
      </div>
    </div>
    
);
}

export default Login;
