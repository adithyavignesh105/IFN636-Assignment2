import React, { useEffect, useMemo, useState } from "react";

/* ===== API paths (match your backend) ===== */
const API = {
  shifts: {
    list: "/api/shifts",      // GET (employees get own shifts)
    swap: "/api/shifts/swap", // POST (employee proposes swap)
  },
  leaves: {
    list: "/api/leaves",      // GET
    create: "/api/leaves",    // POST
  },
  users: { list: "/api/users" }, // GET (used for the user dropdown)
};

/* Safe body reader (JSON or text) */
const readBody = async (res) => {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try { return await res.json(); } catch { return null; }
  }
  try { return await res.text(); } catch { return null; }
};

/* Flexible date helpers */
const dateFrom = (obj) =>
  (obj && (obj.startDate || obj.date || obj.from || obj.start || obj.shiftDate)) || null;
const dateTo = (obj) =>
  (obj && (obj.endDate || obj.date || obj.to || obj.end || obj.shiftDate)) || null;

const fmt = (d) => (d ? new Date(d).toLocaleDateString() : "");

/* ---------- Component ---------- */
function EmployeeDashboard({ user }) {
  const [myShifts, setMyShifts] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // Leave form
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  // Swap form (dropdown-based)
  const [swapForm, setSwapForm] = useState({
    myShiftId: "",
    targetUserId: "",
    targetDate: "",
  });

  // API base (use .env.local -> REACT_APP_API_BASE_URL=http://localhost:5000, or CRA proxy)
  const BASE = process.env.REACT_APP_API_BASE_URL || "";

  // My identity
  const { meId, meName } = useMemo(() => {
    let id = null, name = null;
    if (user && (user._id || user.id)) {
      id = user._id || user.id;
      name = user.name || user.fullName || user.username || user.email || "Me";
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        id = stored._id || stored.id || null;
        name = stored.name || stored.fullName || stored.username || stored.email || "Me";
      } catch {}
    }
    return { meId: id, meName: name || "Me" };
  }, [user]);

  /* Load shifts + leaves + users */
  const loadEmployeeData = async () => {
    try {
      const t = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${t}` };

      const [shiftsRes, leavesRes, usersRes] = await Promise.all([
        fetch(`${BASE}${API.shifts.list}`, { headers }),
        fetch(`${BASE}${API.leaves.list}`, { headers }),
        fetch(`${BASE}${API.users.list}`,  { headers }),
      ]);

      const [shiftsRaw, leavesRaw, usersRaw] = await Promise.all([
        readBody(shiftsRes),
        readBody(leavesRes),
        readBody(usersRes),
      ]);

      // Shifts: employees get only their own
      setMyShifts(Array.isArray(shiftsRaw) ? shiftsRaw : []);

      // Leaves: accept [] or {leaves:[...]} or {data:[...]}
      const leavesArr = Array.isArray(leavesRaw)
        ? leavesRaw
        : Array.isArray(leavesRaw?.leaves)
        ? leavesRaw.leaves
        : Array.isArray(leavesRaw?.data)
        ? leavesRaw.data
        : [];

      const mine = meId
        ? leavesArr.filter(
            (l) =>
              l?.user?._id === meId ||
              l?.userId === meId ||
              (typeof l?.user === "string" && l.user === meId)
          )
        : leavesArr;

      setMyLeaves(mine);

      // Users list for dropdown (accept [] or {users:[...]})
      const usersArr = Array.isArray(usersRaw)
        ? usersRaw
        : Array.isArray(usersRaw?.users)
        ? usersRaw.users
        : [];
      setAllUsers(usersArr);
    } catch (e) {
      console.error(e);
      setMyShifts([]);
      setMyLeaves([]);
      setAllUsers([]);
    }
  };

  useEffect(() => {
    loadEmployeeData();
  }, [BASE]);

  /* Submit leave -> re-fetch so it shows immediately */
  const submitLeave = async (e) => {
    e.preventDefault();
    try {
      const t = localStorage.getItem("token");
      const res = await fetch(`${BASE}${API.leaves.create}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${t}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ startDate, endDate, reason }),
      });

      const body = await readBody(res);
      if (!res.ok) {
        console.error("Leave submit failed:", res.status, body);
        alert(
          (body && body.message) ||
            (typeof body === "string" ? body : `Failed to submit leave (HTTP ${res.status})`)
        );
        return;
      }

      setStartDate("");
      setEndDate("");
      setReason("");
      await loadEmployeeData();
    } catch (err) {
      console.error(err);
      alert("Failed to submit leave");
    }
  };

  /* Submit swap request (dropdown user + date) */
  const submitSwap = async (e) => {
    e.preventDefault();

    if (!swapForm.myShiftId) {
      alert("Please select your shift to swap.");
      return;
    }
    if (!swapForm.targetUserId || !swapForm.targetDate) {
      alert("Please select a user to swap with and a target date.");
      return;
    }

    const payload = {
      initiatorShiftId: swapForm.myShiftId,
      targetUserId: swapForm.targetUserId,
      date: swapForm.targetDate,
    };

    try {
      const t = localStorage.getItem("token");
      const res = await fetch(`${BASE}${API.shifts.swap}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${t}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const body = await readBody(res);
      if (!res.ok) {
        console.error("Swap request failed:", res.status, body);
        alert(
          (body && body.message) ||
            (typeof body === "string" ? body : `Failed to request swap (HTTP ${res.status})`)
        );
        return;
      }

      setSwapForm({ myShiftId: "", targetUserId: "", targetDate: "" });
      alert("Swap request sent!");
    } catch (err) {
      console.error(err);
      alert("Failed to request swap");
    }
  };

  // Label for "My shift" options — show your name, not the shift id
  const shiftLabel = (s) => {
    const d =
      s.date || s.shiftDate || s.startDate || s.assignedDate || s.scheduledFor || s.day || s.dayDate;
    const ds = d ? new Date(d).toLocaleDateString() : "(no date)";
    return `${ds} — ${meName}`;
  };

  // Build user dropdown options (exclude self)
  const usersForDropdown = useMemo(() => {
    const arr = Array.isArray(allUsers) ? allUsers
              : Array.isArray(allUsers?.users) ? allUsers.users : [];
    return arr.filter((u) => (u?._id || u?.id) && (u._id || u.id) !== meId);
  }, [allUsers, meId]);

  const userLabel = (u) =>
    u?.name || u?.fullName || u?.username || u?.email || "User";

  return (
    <div className="container py-3">
      {/* My Shifts */}
      <section className="card shadow-sm p-3 mb-3">
        <h3 className="mb-3 text-primary fw-bold">My Shifts</h3>
        <ul className="list-unstyled d-grid gap-2">
          {myShifts.map((s, i) => (
            <li
              key={s._id || `shift-${i}`}
              className="d-flex flex-wrap align-items-center justify-content-between gap-2 border rounded-3 p-2"
            >
              <span>{shiftLabel(s)}</span>
            </li>
          ))}
          {myShifts.length === 0 && <li className="text-muted">No shifts found.</li>}
        </ul>
      </section>

      {/* Request Swap (dropdown-based) */}
      <section className="card shadow-sm p-3 mb-3">
        <h3 className="mb-3 text-primary fw-bold">Request Swap</h3>
        <form className="row g-3" onSubmit={submitSwap}>
          <div className="col-12 col-md-6">
            <label className="form-label">My shift</label>
            <select
              className="form-select"
              value={swapForm.myShiftId}
              onChange={(e) => setSwapForm({ ...swapForm, myShiftId: e.target.value })}
              required
            >
              <option value="">Select your shift…</option>
              {myShifts.map((s) => (
                <option key={s._id} value={s._id}>
                  {shiftLabel(s)}
                </option>
              ))}
            </select>
            <div className="form-text">Choose the shift you want to swap away.</div>
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label">User to swap with</label>
            <select
              className="form-select"
              value={swapForm.targetUserId}
              onChange={(e) => setSwapForm({ ...swapForm, targetUserId: e.target.value })}
              required
            >
              <option value="">Select a user…</option>
              {usersForDropdown.map((u) => (
                <option key={u._id || u.id} value={u._id || u.id}>
                  {userLabel(u)}
                </option>
              ))}
            </select>
            <div className="form-text">Pick the person you want to swap with.</div>
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label">Target date</label>
            <input
              type="date"
              className="form-control"
              value={swapForm.targetDate}
              onChange={(e) => setSwapForm({ ...swapForm, targetDate: e.target.value })}
              required
            />
          </div>

          <div className="col-12 d-flex justify-content-end">
            <button type="submit" className="btn btn-primary">Request Swap</button>
          </div>
        </form>
        {usersForDropdown.length === 0 && (
          <div className="mt-2 small text-secondary">
            Can’t see users? Ensure this account can access <code>/api/users</code>, or ask an admin to enable it.
          </div>
        )}
      </section>

      {/* Request Leave */}
      <section className="card shadow-sm p-3 mb-3">
        <h3 className="mb-3 text-primary fw-bold">Request Leave</h3>
        <form className="row g-2" onSubmit={submitLeave}>
          <div className="col-12 col-sm-6">
            <label htmlFor="start" className="form-label">Start date</label>
            <input
              id="start"
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="col-12 col-sm-6">
            <label htmlFor="end" className="form-label">End date</label>
            <input
              id="end"
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          <div className="col-12">
            <label htmlFor="reason" className="form-label">Reason (optional)</label>
            <textarea
              id="reason"
              rows={3}
              className="form-control"
              placeholder="e.g., personal leave"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="col-12 d-flex justify-content-end">
            <button type="submit" className="btn btn-primary">Submit Request</button>
          </div>
        </form>
      </section>

      {/* My Leave Requests */}
      <section className="card shadow-sm p-3">
        <h3 className="mb-3 text-primary fw-bold">My Leave Requests</h3>
        <ul className="list-unstyled d-grid gap-2">
          {myLeaves.map((l) => (
            <li
              key={l._id}
              className="d-flex flex-wrap align-items-center justify-content-between gap-2 border rounded-3 p-2"
            >
              <span>
                {fmt(dateFrom(l))} &rarr; {fmt(dateTo(l))} — {l.status || "pending"}
              </span>
            </li>
          ))}
          {myLeaves.length === 0 && (
            <li className="text-muted">No leave requests yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

export default EmployeeDashboard;
