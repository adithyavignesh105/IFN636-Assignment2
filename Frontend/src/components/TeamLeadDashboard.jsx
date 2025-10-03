import React, { useEffect, useState } from "react";

/* ==== API paths that match your backend ==== */
const API = {
  shifts: { swapList: "/api/shifts/swap-requests" }, // GET (Manager/TeamLead)
  leaves: {
    list: "/api/leaves",                              // GET
    approveTL: (id) => `/api/leaves/${id}/approve-teamlead`, // PATCH
    reject:    (id) => `/api/leaves/${id}/reject`,           // PATCH (TL or Manager)
  },
};

/* Safe body reader: JSON if possible, else text */
const readBody = async (res) => {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try { return await res.json(); } catch { return null; }
  }
  try { return await res.text(); } catch { return null; }
};

/* Small format helpers */
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "");
const leaveDateRange = (l) =>
  `${(l?.startDate || "").toString().substring(0, 10)} to ${(l?.endDate || "").toString().substring(0, 10)}`;

function TeamLeadDashboard() {
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [swapRequests, setSwapRequests] = useState([]);

  const BASE = process.env.REACT_APP_API_BASE_URL || ""; // or use CRA proxy

  // ---- Load data ----
  const loadAll = async () => {
    try {
      const t = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${t}` };

      const [leavesRes, swapsRes] = await Promise.all([
        fetch(`${BASE}${API.leaves.list}`, { headers }),
        fetch(`${BASE}${API.shifts.swapList}`, { headers }),
      ]);

      const [leavesRaw, swapsRaw] = await Promise.all([
        readBody(leavesRes),
        readBody(swapsRes),
      ]);

      const leaves = Array.isArray(leavesRaw) ? leavesRaw : [];
      // TL sees leaves to approve at the first stage; filter by 'pending'
      setPendingLeaves(leaves.filter((l) => (l?.status || "").toLowerCase() === "pending"));

      setSwapRequests(Array.isArray(swapsRaw) ? swapsRaw : []);
    } catch (e) {
      console.error(e);
      setPendingLeaves([]);
      setSwapRequests([]);
    }
  };

  useEffect(() => { loadAll(); }, [BASE]);

  // ---- Actions ----
  const approveAsTL = async (id) => {
    try {
      const t = localStorage.getItem("token");
      const res = await fetch(`${BASE}${API.leaves.approveTL(id)}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${t}` },
      });
      const body = await readBody(res);
      if (!res.ok) {
        console.error("TL approve failed:", res.status, body);
        alert((body && body.message) || "Failed to approve leave");
        return;
      }
      setPendingLeaves((prev) => prev.filter((l) => l._id !== id));
    } catch (e) {
      console.error(e);
      alert("Failed to approve leave");
    }
  };

  const rejectLeave = async (id) => {
    try {
      const t = localStorage.getItem("token");
      const res = await fetch(`${BASE}${API.leaves.reject(id)}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${t}` },
      });
      const body = await readBody(res);
      if (!res.ok) {
        console.error("TL reject failed:", res.status, body);
        alert((body && body.message) || "Failed to reject leave");
        return;
      }
      setPendingLeaves((prev) => prev.filter((l) => l._id !== id));
    } catch (e) {
      console.error(e);
      alert("Failed to reject leave");
    }
  };

  return (
    <div className="container py-3">
      <h2 className="mb-3 fw-bold">Team Lead Dashboard</h2>

      <div className="d-grid gap-3">
        {/* Pending TL Approvals */}
        <section className="card shadow-sm border-0 rounded-4 p-3 fade-slide-in">
          <div className="d-flex align-items-center justify-content-between">
            <h3 className="mb-3 text-primary fw-bold">Pending Leave Approvals</h3>
          </div>

          <ul className="list-unstyled d-grid gap-2">
            {pendingLeaves.map((l) => (
              <li
                key={l._id}
                className="d-flex flex-wrap align-items-center justify-content-between gap-2 border rounded-3 p-3 card-hover"
              >
                <div className="d-flex flex-column">
                  <span className="fw-semibold">
                    {(l?.user && (l.user.name || l.user.fullName || l.user.username || l.user.email)) || "User"}
                  </span>
                  <small className="text-secondary">
                    {leaveDateRange(l)} &middot; {l?.reason || "No reason provided"}
                  </small>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-success" onClick={() => approveAsTL(l._id)}>
                    Approve
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => rejectLeave(l._id)}>
                    Reject
                  </button>
                </div>
              </li>
            ))}
            {pendingLeaves.length === 0 && (
              <li className="text-muted">No leave requests awaiting your approval.</li>
            )}
          </ul>
        </section>

        {/* Swap requests (view-only for TL) */}
        <section className="card shadow-sm border-0 rounded-4 p-3 fade-slide-in">
          <h3 className="mb-3 text-primary fw-bold">Swap Requests</h3>
          <ul className="list-unstyled d-grid gap-2">
            {swapRequests.map((s) => (
              <li
                key={s._id}
                className="d-flex flex-wrap align-items-center justify-content-between gap-2 border rounded-3 p-3 card-hover"
              >
                <div className="d-flex flex-column">
                  <span className="fw-semibold">
                    {(s?.initiator && (s.initiator.name || s.initiator.fullName || s.initiator.email)) || "User"} ↔{" "}
                    {(s?.target && (s.target.name || s.target.fullName || s.target.email)) || "User"}
                  </span>
                  <small className="text-secondary">
                    {fmtDate(s?.initiatorShift?.date)} &middot; {fmtDate(s?.targetShift?.date)}
                  </small>
                </div>
                <span className="badge text-bg-light">Manager approval required</span>
              </li>
            ))}
            {swapRequests.length === 0 && (
              <li className="text-muted">No swap requests at the moment.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default TeamLeadDashboard;
