import React, { useEffect, useMemo, useState } from "react";

/* ===== API paths that match your backend ===== */
const API = {
  shifts: {
    list: "/api/shifts",                         // GET
    create: "/api/shifts/assign",                // POST (manager)
    swapList: "/api/shifts/swap-requests",       // GET (manager/TL)
    approveSwap: (id) => `/api/shifts/swap/${id}/approve`, // PATCH (manager)
  },
  leaves: {
    list: "/api/leaves",                         // GET (filter pending client-side)
    approveManager: (id) => `/api/leaves/${id}/approve-manager`, // PATCH (manager)
  },
  users: { list: "/api/users" },                 // GET (manager)
};

/* Safely read a response as JSON or text */
const readBody = async (res) => {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try { return await res.json(); } catch { return null; }
  }
  try { return await res.text(); } catch { return null; }
};

/* Field candidates for robust rendering */
const NAME_FIELDS = ["name", "fullName", "username", "email", "firstName", "lastName"];
const NESTED_USER_KEYS = ["user", "assignedTo", "employee", "owner"];
const ID_KEYS   = ["userId", "assignedToId", "employeeId", "ownerId"];
const DATE_KEYS = ["date", "shiftDate", "startDate", "assignedDate", "scheduledFor", "day", "dayDate"];
const TIME_KEYS = ["startTime", "start", "from"]; // in case a timestamp includes the date

function ManagerDashboard() {
  const [allShifts, setAllShifts] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingSwaps, setPendingSwaps] = useState([]);
  const [newShift, setNewShift] = useState({ userId: "", date: "" });
  const [allUsers, setAllUsers] = useState([]);

  const BASE = process.env.REACT_APP_API_BASE_URL || ""; // or use CRA proxy

  /* Normalize users to array and build id->name map */
  const usersArray = useMemo(
    () =>
      Array.isArray(allUsers)
        ? allUsers
        : Array.isArray(allUsers?.users)
        ? allUsers.users
        : [],
    [allUsers]
  );

  const userMap = useMemo(() => {
    const m = {};
    for (const u of usersArray) {
      const n = NAME_FIELDS.map((k) => u?.[k]).find(Boolean) || "User";
      if (u?._id) m[u._id] = n;
      if (u?.id)  m[u.id]  = n; // just in case
    }
    return m;
  }, [usersArray]);

  const shortId = (val) =>
    typeof val === "string" && val.length > 8 ? ` (${val.slice(-6)})` : "";

  const displayDate = (obj) => {
    for (const k of DATE_KEYS) {
      const v = obj?.[k];
      if (v) return new Date(v).toLocaleDateString();
    }
    for (const k of TIME_KEYS) {
      const v = obj?.[k];
      if (v && typeof v === "string") {
        const d = v.slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(d).toLocaleDateString();
      }
    }
    return "";
  };

  const displayName = (item) => {
    // 1) nested user-like object that carries a name
    for (const key of NESTED_USER_KEYS) {
      const obj = item?.[key];
      if (obj && typeof obj === "object") {
        const n = NAME_FIELDS.map((k) => obj?.[k]).find(Boolean);
        if (n) return n;
        if (obj?._id && userMap[obj._id]) return userMap[obj._id];
      }
      if (typeof item?.[key] === "string" && userMap[item[key]]) return userMap[item[key]];
    }
    // 2) id fields
    for (const k of ID_KEYS) {
      const id = item?.[k];
      if (id && userMap[id]) return userMap[id];
      if (id) return `User${shortId(id)}`;
    }
    // 3) flat name props the API might send
    const flat = ["userName", "employeeName", "assignedToName", "createdByName"]
      .map((k) => item?.[k])
      .find(Boolean);
    if (flat) return flat;

    return "User";
  };

  /* ------- Load data ------- */
  const loadAll = async () => {
    try {
      const t = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${t}` };

      const [shiftsRes, leavesRes, swapsRes, usersRes] = await Promise.all([
        fetch(`${BASE}${API.shifts.list}`, { headers }),
        fetch(`${BASE}${API.leaves.list}`, { headers }),
        fetch(`${BASE}${API.shifts.swapList}`, { headers }),
        fetch(`${BASE}${API.users.list}`, { headers }),
      ]);

      const [shifts, leaves, swaps, users] = await Promise.all([
        readBody(shiftsRes),
        readBody(leavesRes),
        readBody(swapsRes),
        readBody(usersRes),
      ]);

      setAllShifts(Array.isArray(shifts) ? shifts : []);
      setPendingLeaves(
        (Array.isArray(leaves) ? leaves : []).filter(
          (l) => (l.status || "").toLowerCase() === "pending"
        )
      );
      setPendingSwaps(Array.isArray(swaps) ? swaps : []);
      setAllUsers(Array.isArray(users) || (users && Array.isArray(users.users)) ? users : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAll();
  }, [BASE]); // no eslint directive needed

  /* ------- Actions ------- */
  const submitNewShift = async (e) => {
    e.preventDefault();
    try {
      const t = localStorage.getItem("token");
      const res = await fetch(`${BASE}${API.shifts.create}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${t}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ userId: newShift.userId, date: newShift.date }),
      });

      const body = await readBody(res);
      if (!res.ok) {
        console.error("Assign shift failed:", res.status, body);
        alert(
          (body && body.message) ||
            (typeof body === "string" ? body : `Failed to assign shift (HTTP ${res.status})`)
        );
        return;
      }

      // Re-fetch so the new row includes proper name/date from server
      setNewShift({ userId: "", date: "" });
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Failed to assign shift");
    }
  };

  const approveLeave = async (id) => {
    try {
      const t = localStorage.getItem("token");
      const res = await fetch(`${BASE}${API.leaves.approveManager(id)}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${t}` },
      });
      const body = await readBody(res);
      if (!res.ok) {
        console.error("Approve leave failed:", res.status, body);
        alert((body && body.message) || "Failed to approve leave");
        return;
      }
      setPendingLeaves((prev) => prev.filter((l) => l._id !== id));
    } catch (e) {
      console.error(e);
      alert("Failed to approve leave");
    }
  };

  const approveSwap = async (id) => {
    try {
      const t = localStorage.getItem("token");
      const res = await fetch(`${BASE}${API.shifts.approveSwap(id)}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${t}` },
      });
      const body = await readBody(res);
      if (!res.ok) {
        console.error("Approve swap failed:", res.status, body);
        alert((body && body.message) || "Failed to approve swap");
        return;
      }
      setPendingSwaps((prev) => prev.filter((s) => s._id !== id));
    } catch (e) {
      console.error(e);
      alert("Failed to approve swap");
    }
  };

  /* ------- UI ------- */
  return (
    <div className="container py-3">
      <h2 className="mb-3 fw-bold">Manager Dashboard</h2>

      <div className="d-grid gap-3">
        {/* All Shifts */}
        <section className="card shadow-sm p-3">
          <h3 className="mb-3 text-primary fw-bold">All Shifts</h3>
          <ul className="list-unstyled d-grid gap-2">
            {allShifts.map((s) => (
              <li
                key={s._id || `${displayName(s)}-${displayDate(s)}`}
                className="d-flex flex-wrap align-items-center justify-content-between gap-2 border rounded-3 p-2"
              >
                <span>
                  {displayName(s)} — {displayDate(s)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Assign New Shift */}
        <section className="card shadow-sm p-3">
          <h3 className="mb-3 text-primary fw-bold">Assign New Shift</h3>
          <form className="row g-2" onSubmit={submitNewShift}>
            <div className="col-12 col-sm-6">
              <select
                className="form-select"
                value={newShift.userId}
                onChange={(e) => setNewShift({ ...newShift, userId: e.target.value })}
                required
              >
                <option value="">Select user...</option>
                {usersArray.map((u) => (
                  <option key={u._id || u.id} value={u._id || u.id}>
                    {NAME_FIELDS.map((k) => u?.[k]).find(Boolean) || u?.email || "User"}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-6">
              <input
                type="date"
                className="form-control"
                value={newShift.date}
                onChange={(e) => setNewShift({ ...newShift, date: e.target.value })}
                required
              />
            </div>
            <div className="col-12 d-flex justify-content-end">
              <button type="submit" className="btn btn-primary">
                Assign Shift
              </button>
            </div>
          </form>
        </section>

        {/* Pending Leave Approvals */}
        <section className="card shadow-sm p-3">
          <h3 className="mb-3 text-primary fw-bold">Pending Leave Approvals</h3>
          <ul className="list-unstyled d-grid gap-2">
            {pendingLeaves.map((l) => (
              <li
                key={l._id}
                className="d-flex flex-wrap align-items-center justify-content-between gap-2 border rounded-3 p-2"
              >
                <span>
                  {displayName(l)}: {l.startDate?.substring(0, 10)} to {l.endDate?.substring(0, 10)} — {l.status}
                </span>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => approveLeave(l._id)}
                  >
                    Approve
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Pending Swap Approvals */}
        <section className="card shadow-sm p-3">
          <h3 className="mb-3 text-primary fw-bold">Pending Swap Approvals</h3>
          <ul className="list-unstyled d-grid gap-2">
            {pendingSwaps.map((s) => (
              <li
                key={s._id}
                className="d-flex flex-wrap align-items-center justify-content-between gap-2 border rounded-3 p-2"
              >
                <span>
                  Swap between {displayName(s.initiator || { userId: s.initiatorId })}
                  {" and "}
                  {displayName(s.target || { userId: s.targetId })}
                  {" ("}
                  {displayDate(s.initiatorShift || {})}
                  {"  &&  "}
                  {displayDate(s.targetShift || {})}
                  {")"}
                </span>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => approveSwap(s._id)}
                  >
                    Approve
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default ManagerDashboard;
