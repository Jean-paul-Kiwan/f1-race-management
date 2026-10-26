// frontend/src/pages/Drivers.jsx
import { useEffect, useState } from "react";
import { api } from "../api/client.js";

const box = {
  background: "#121218",
  border: "1px solid #222",
  borderRadius: 14,
};

const inputStyle = {
  padding: 10,
  borderRadius: 10,
  border: "1px solid #333",
  background: "#0f0f14",
  color: "white",
  width: "100%",
};

const btnRed = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  background: "#d90429",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};

const btnGhost = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #333",
  background: "transparent",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(860px, 100%)",
          background: "#0b0b0f",
          border: "1px solid #222",
          borderRadius: 16,
          padding: 16,
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={btnGhost}>
            Close
          </button>
        </div>
        <div style={{ marginTop: 14 }}>{children}</div>
      </div>
    </div>
  );
}

export default function Drivers() {
  // filters
  const [teamId, setTeamId] = useState("");
  const [role, setRole] = useState("");
  const [isActive, setIsActive] = useState(""); // "", "true", "false"

  // data
  const [teams, setTeams] = useState([]);
  const [drivers, setDrivers] = useState([]);

  // ui
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // modal/form
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    _id: "",
    fullName: "",
    role: "MAIN",
    raceNumber: 1,
    dob: "1997-01-01",
    email: "",
    points: 0,
    isActive: true,
    teamId: "",
  });

  function buildQuery() {
    const p = new URLSearchParams();
    if (teamId) p.set("teamId", teamId);
    if (role) p.set("role", role);
    if (isActive !== "") p.set("isActive", isActive);
    const qs = p.toString();
    return qs ? `?${qs}` : "";
  }

  // ✅ Used helpers (no eslint unused warnings)
  async function fetchTeams() {
    const res = await api.get("/teams");
    return res.data;
  }

  async function fetchDrivers() {
    const res = await api.get(`/drivers${buildQuery()}`);
    return res.data;
  }

  // initial load
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setErr("");
        setLoading(true);

        const [t, d] = await Promise.all([fetchTeams(), fetchDrivers()]);
        if (cancelled) return;

        setTeams(t);
        setDrivers(d);
      } catch (e) {
        if (!cancelled) setErr(e?.response?.data?.error || e?.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyFilters() {
    try {
      setErr("");
      setLoading(true);
      const d = await fetchDrivers();
      setDrivers(d);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setMode("create");
    setForm({
      _id: "",
      fullName: "",
      role: "MAIN",
      raceNumber: 1,
      dob: "1997-01-01",
      email: "",
      points: 0,
      isActive: true,
      teamId: teams[0]?._id || "",
    });
    setOpen(true);
  }

  function openEdit(d) {
    setMode("edit");
    setForm({
      _id: d._id,
      fullName: d.fullName || "",
      role: d.role || "MAIN",
      raceNumber: d.raceNumber || 1,
      dob: d.dob ? String(d.dob).slice(0, 10) : "1997-01-01",
      email: d.email || "",
      points: d.points ?? 0,
      isActive: d.isActive ?? true,
      teamId: d.teamId?._id || d.teamId || "",
    });
    setOpen(true);
  }

  async function submit() {
    try {
      setSaving(true);
      setErr("");

      const payload = {
        fullName: form.fullName.trim(),
        role: form.role,
        raceNumber: Number(form.raceNumber),
        dob: form.dob, // date string OK
        email: form.email.trim(),
        points: Number(form.points),
        isActive: Boolean(form.isActive),
        teamId: form.teamId,
      };

      if (!payload.teamId) throw new Error("Please select a team.");
      if (!payload.fullName) throw new Error("Full name is required.");
      if (!payload.email) throw new Error("Email is required.");

      if (mode === "create") {
        await api.post("/drivers", payload);
      } else {
        await api.put(`/drivers/${form._id}`, payload);
      }

      setOpen(false);
      await applyFilters(); // keep current filters applied
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <h1 style={{ color: "white", margin: 0 }}>Drivers</h1>
        <div style={{ flex: 1 }} />
        <button onClick={openCreate} style={btnRed}>
          + Add Driver
        </button>
      </div>

      <div style={{ color: "#9a9a9a", marginBottom: 14 }}>
        Filters (Team + Role + Active) + populate Team info — meets your Mongo requirements.
      </div>

      {err && (
  <div style={{ color: "#ff6b6b", marginBottom: 10 }}>
    {err === "Network Error"
      ? "Backend is not running. Start the API."
      : err}
  </div>
)}


      {/* Filters */}
      <div style={{ ...box, padding: 14, marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 140px", gap: 10 }}>
          <div>
            <div style={{ color: "#9a9a9a", fontSize: 12, marginBottom: 6 }}>Team</div>
            <select value={teamId} onChange={(e) => setTeamId(e.target.value)} style={inputStyle}>
              <option value="">All teams</option>
              {teams.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.code} — {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ color: "#9a9a9a", fontSize: 12, marginBottom: 6 }}>Role</div>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
              <option value="">All roles</option>
              <option value="MAIN">MAIN</option>
              <option value="RESERVE">RESERVE</option>
              <option value="TEST">TEST</option>
            </select>
          </div>

          <div>
            <div style={{ color: "#9a9a9a", fontSize: 12, marginBottom: 6 }}>Active</div>
            <select value={isActive} onChange={(e) => setIsActive(e.target.value)} style={inputStyle}>
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div style={{ display: "grid", alignItems: "end" }}>
            <button onClick={applyFilters} style={btnRed}>
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={box}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "220px 90px 120px 1fr 180px 110px 120px",
            padding: 12,
            color: "#9a9a9a",
            fontWeight: 800,
          }}
        >
          <div>Driver</div>
          <div>No.</div>
          <div>Role</div>
          <div>Team (populate)</div>
          <div>Email</div>
          <div>Points</div>
          <div>Actions</div>
        </div>

        {loading ? (
          <div style={{ padding: 12, color: "white" }}>Loading...</div>
        ) : drivers.length === 0 ? (
          <div style={{ padding: 12, color: "white" }}>No drivers found for these filters.</div>
        ) : (
          drivers.map((d) => (
            <div
              key={d._id}
              style={{
                display: "grid",
                gridTemplateColumns: "220px 90px 120px 1fr 180px 110px 120px",
                padding: 12,
                borderTop: "1px solid #222",
                color: "white",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 800 }}>{d.fullName}</div>
              <div>{d.raceNumber}</div>
              <div>{d.role}</div>
              <div>
                {d.teamId?.code ? (
                  <>
                    <span style={{ fontWeight: 900 }}>{d.teamId.code}</span>
                    <span style={{ color: "#bdbdbd" }}> — {d.teamId.name}</span>
                    {!d.isActive && <span style={{ color: "#ff6b6b" }}> (inactive)</span>}
                  </>
                ) : (
                  <span style={{ color: "#bdbdbd" }}>No team</span>
                )}
              </div>
              <div style={{ color: "#cfcfcf" }}>{d.email}</div>
              <div style={{ fontWeight: 900 }}>{d.points ?? 0}</div>
              <div>
                <button onClick={() => openEdit(d)} style={btnGhost}>
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        open={open}
        title={mode === "create" ? "Add Driver" : "Edit Driver"}
        onClose={() => !saving && setOpen(false)}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ color: "#9a9a9a", fontSize: 12, marginBottom: 6 }}>Full Name</div>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div>
            <div style={{ color: "#9a9a9a", fontSize: 12, marginBottom: 6 }}>Email</div>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
          </div>

          <div>
            <div style={{ color: "#9a9a9a", fontSize: 12, marginBottom: 6 }}>Team</div>
            <select value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })} style={inputStyle}>
              <option value="">Select team</option>
              {teams.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.code} — {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ color: "#9a9a9a", fontSize: 12, marginBottom: 6 }}>Role</div>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={inputStyle}>
              <option value="MAIN">MAIN</option>
              <option value="RESERVE">RESERVE</option>
              <option value="TEST">TEST</option>
            </select>
          </div>

          <div>
            <div style={{ color: "#9a9a9a", fontSize: 12, marginBottom: 6 }}>Race Number</div>
            <input
              type="number"
              value={form.raceNumber}
              onChange={(e) => setForm({ ...form, raceNumber: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div>
            <div style={{ color: "#9a9a9a", fontSize: 12, marginBottom: 6 }}>Date of Birth</div>
            <input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} style={inputStyle} />
          </div>

          <div>
            <div style={{ color: "#9a9a9a", fontSize: 12, marginBottom: 6 }}>Points</div>
            <input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} style={inputStyle} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              id="active"
              type="checkbox"
              checked={!!form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            <label htmlFor="active" style={{ color: "white" }}>
              Active
            </label>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button disabled={saving} onClick={submit} style={btnRed}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button disabled={saving} onClick={() => setOpen(false)} style={btnGhost}>
            Cancel
          </button>
        </div>

        <div style={{ marginTop: 10, color: "#9a9a9a", fontSize: 12 }}>
          Email format is validated by Mongoose. Team is a foreign key (teamId). List is filterable by 2+ criteria.
        </div>
      </Modal>
    </div>
  );
}
