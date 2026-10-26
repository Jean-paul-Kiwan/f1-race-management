// frontend/src/pages/Results.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";

const box = { background: "#121218", border: "1px solid #222", borderRadius: 14 };
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
    width: "min(980px, 100%)",
    maxHeight: "90vh",      
    overflowY: "auto",      
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

function safeJsonStringify(val) {
  try {
    return JSON.stringify(val ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

export default function Results() {
  // Filters (2+ criteria demo)
  const [raceId, setRaceId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [posMax, setPosMax] = useState(""); // e.g. show top 10

  // Data
  const [races, setRaces] = useState([]);
  const [teams, setTeams] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [results, setResults] = useState([]);

  // UI
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Modal / Form
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit
  const [saving, setSaving] = useState(false);

  // ✅ Embedded-array style: tyreStints is an array of objects
  // Example expected by schema: [{ compound: "SOFT", laps: 12 }, ...]
  const emptyForm = useMemo(
    () => ({
      _id: "",
      raceId: "",
      driverId: "",
      position: 1,
      pointsAwarded: 25,

      // ✅ Array field (embedded)
      tyreStints: [
        { compound: "SOFT", laps: 12 },
        { compound: "MEDIUM", laps: 38 },
      ],

      // ✅ JSON field (array of objects)
      penalties: [{ type: "TRACK_LIMITS", seconds: 0, note: "none" }],

      // Extra examples (still fine even if not required)
      didNotFinish: false,
      extraData: { safetyCar: false, weather: "Dry" },
    }),
    []
  );

  const [form, setForm] = useState(emptyForm);

  function buildResultsQuery() {
    // backend supports raceId filter
    const p = new URLSearchParams();
    if (raceId) p.set("raceId", raceId);
    const qs = p.toString();
    return qs ? `?${qs}` : "";
  }

  async function loadEverything() {
    const [r, t, d, resu] = await Promise.all([
      api.get("/races"),
      api.get("/teams"),
      api.get("/drivers"),
      api.get(`/results${buildResultsQuery()}`),
    ]);
    setRaces(r.data);
    setTeams(t.data);
    setDrivers(d.data);
    setResults(resu.data);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setErr("");
        setLoading(true);
        await loadEverything();
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

  async function reloadResultsOnly() {
    const resu = await api.get(`/results${buildResultsQuery()}`);
    setResults(resu.data);
  }

  async function applyFilters() {
    try {
      setErr("");
      setLoading(true);
      await reloadResultsOnly();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to load results");
    } finally {
      setLoading(false);
    }
  }

  // Extra criteria filtering on frontend after populate is loaded
  const filteredResults = useMemo(() => {
    let arr = [...results];

    if (teamId) {
      arr = arr.filter((x) => x?.driverId?.teamId?._id === teamId);
    }

    if (posMax) {
      const mx = Number(posMax);
      if (!Number.isNaN(mx)) arr = arr.filter((x) => Number(x.position) <= mx);
    }

    arr.sort((a, b) => Number(a.position) - Number(b.position));
    return arr;
  }, [results, teamId, posMax]);

  function openCreate() {
    setMode("create");
    setForm({
      ...emptyForm,
      raceId: races[0]?._id || "",
      driverId: drivers[0]?._id || "",
    });
    setOpen(true);
  }

  function openEdit(r) {
    setMode("edit");
    setForm({
      _id: r._id,
      raceId: r.raceId?._id || r.raceId || "",
      driverId: r.driverId?._id || r.driverId || "",
      position: r.position ?? 1,
      pointsAwarded: r.pointsAwarded ?? 0,
      tyreStints: Array.isArray(r.tyreStints) ? r.tyreStints : [],
      penalties: Array.isArray(r.penalties) ? r.penalties : [],
      didNotFinish: !!r.didNotFinish,
      extraData: r.extraData || {},
    });
    setOpen(true);
  }

  async function submit() {
    try {
      setSaving(true);
      setErr("");

      // ✅ tyreStints must be a JSON ARRAY of OBJECTS
      let tyreStintsObj = form.tyreStints;
      if (typeof form.tyreStints === "string") tyreStintsObj = JSON.parse(form.tyreStints);

      if (!Array.isArray(tyreStintsObj)) throw new Error("tyreStints must be a JSON array");
      for (const s of tyreStintsObj) {
        if (!s || typeof s !== "object") throw new Error("Each tyre stint must be an object");
        if (!s.compound) throw new Error('Each tyre stint must have "compound"');
        if (s.laps == null || Number.isNaN(Number(s.laps))) throw new Error('Each tyre stint must have numeric "laps"');
        s.laps = Number(s.laps);
        s.compound = String(s.compound).toUpperCase();
      }

      // ✅ penalties JSON
      let penaltiesObj = form.penalties;
      if (typeof form.penalties === "string") penaltiesObj = JSON.parse(form.penalties);
      if (!Array.isArray(penaltiesObj)) throw new Error("penalties must be a JSON array");

      // ✅ extraData JSON
      let extraDataObj = form.extraData;
      if (typeof form.extraData === "string") extraDataObj = JSON.parse(form.extraData);
      if (!extraDataObj || typeof extraDataObj !== "object") throw new Error("extraData must be a JSON object");

      const payload = {
        raceId: form.raceId,
        driverId: form.driverId,
        position: Number(form.position),
        pointsAwarded: Number(form.pointsAwarded),

        tyreStints: tyreStintsObj, // Array (embedded)
        penalties: penaltiesObj, // JSON
        didNotFinish: !!form.didNotFinish, // Boolean
        extraData: extraDataObj, // JSON
      };

      if (!payload.raceId) throw new Error("Race is required");
      if (!payload.driverId) throw new Error("Driver is required");

      if (mode === "create") await api.post("/results", payload);
      else await api.put(`/results/${form._id}`, payload);

      setOpen(false);
      await applyFilters(); // refresh list
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <h1 style={{ color: "white", margin: 0 }}>Results</h1>
        <div style={{ flex: 1 }} />
        <button onClick={openCreate} style={btnRed}>
          + Add Result
        </button>
      </div>

      <div style={{ color: "#9a9a9a", marginBottom: 14 }}>
        populate (race + driver + team), filters (2+ criteria), Insert/Update, Array + JSON fields.
      </div>

      {err && (
        <div style={{ color: "#ff6b6b", marginBottom: 10 }}>
          {err === "Network Error" ? "Backend is not running on http://localhost:5000" : err}
        </div>
      )}

      {/* Filters */}
      <div style={{ ...box, padding: 14, marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 160px 140px", gap: 10 }}>
          <div>
            <div style={{ color: "#9a9a9a", fontSize: 12, marginBottom: 6 }}>Race (criteria #1)</div>
            <select value={raceId} onChange={(e) => setRaceId(e.target.value)} style={inputStyle}>
              <option value="">All races</option>
              {races.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name} ({r.seasonYear})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ color: "#9a9a9a", fontSize: 12, marginBottom: 6 }}>Team (criteria #2)</div>
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
            <div style={{ color: "#9a9a9a", fontSize: 12, marginBottom: 6 }}>Max position (extra)</div>
            <input type="number" placeholder="ex: 10" value={posMax} onChange={(e) => setPosMax(e.target.value)} style={inputStyle} />
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
            gridTemplateColumns: "1fr 1fr 80px 120px 1fr 1fr 110px",
            padding: 12,
            color: "#9a9a9a",
            fontWeight: 800,
          }}
        >
          <div>Race</div>
          <div>Driver</div>
          <div>Pos</div>
          <div>Points</div>
          <div>Team (populate)</div>
          <div>Tyre stints (Array)</div>
          <div>Actions</div>
        </div>

        {loading ? (
          <div style={{ padding: 12, color: "white" }}>Loading...</div>
        ) : filteredResults.length === 0 ? (
          <div style={{ padding: 12, color: "white" }}>No results found for filters.</div>
        ) : (
          filteredResults.map((r) => (
            <div
              key={r._id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 80px 120px 1fr 1fr 110px",
                padding: 12,
                borderTop: "1px solid #222",
                color: "white",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 900 }}>
                {r.raceId?.name || "Race"}
                <span style={{ color: "#bdbdbd" }}> ({r.raceId?.seasonYear || ""})</span>
              </div>

              <div style={{ fontWeight: 800 }}>{r.driverId?.fullName || "Driver"}</div>

              <div>{r.position}</div>
              <div style={{ fontWeight: 900 }}>{r.pointsAwarded}</div>

              <div>
                {r.driverId?.teamId?.code ? (
                  <>
                    <span style={{ fontWeight: 900 }}>{r.driverId.teamId.code}</span>
                    <span style={{ color: "#bdbdbd" }}> — {r.driverId.teamId.name}</span>
                  </>
                ) : (
                  <span style={{ color: "#bdbdbd" }}>No team</span>
                )}
              </div>

              <div style={{ color: "#cfcfcf" }}>
                {Array.isArray(r.tyreStints) && r.tyreStints.length > 0
                  ? r.tyreStints.map((s) => `${s.compound}(${s.laps})`).join(", ")
                  : "-"}
              </div>

              <div>
                <button onClick={() => openEdit(r)} style={btnGhost}>
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal open={open} title={mode === "create" ? "Add Result" : "Edit Result"} onClose={() => !saving && setOpen(false)}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ color: "#9a9a9a", fontSize: 12, marginBottom: 6 }}>Race</div>
            <select value={form.raceId} onChange={(e) => setForm({ ...form, raceId: e.target.value })} style={inputStyle}>
              <option value="">Select race</option>
              {races.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name} ({r.seasonYear})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ color: "#9a9a9a", fontSize: 12, marginBottom: 6 }}>Driver</div>
            <select value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} style={inputStyle}>
              <option value="">Select driver</option>
              {drivers.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.fullName} ({d?.teamId?.code || "No team"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ color: "#9a9a9a", fontSize: 12, marginBottom: 6 }}>Position</div>
            <input type="number" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} style={inputStyle} />
          </div>

          <div>
            <div style={{ color: "#9a9a9a", fontSize: 12, marginBottom: 6 }}>Points Awarded</div>
            <input
              type="number"
              value={form.pointsAwarded}
              onChange={(e) => setForm({ ...form, pointsAwarded: e.target.value })}
              style={inputStyle}
            />
          </div>

          {/* ✅ tyreStints JSON */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ color: "#9a9a9a", fontSize: 12, marginBottom: 6 }}>Tyre Stints (Array of objects JSON)</div>
            <textarea
              rows={6}
              value={typeof form.tyreStints === "string" ? form.tyreStints : safeJsonStringify(form.tyreStints)}
              onChange={(e) => setForm({ ...form, tyreStints: e.target.value })}
              style={{ ...inputStyle, fontFamily: "monospace" }}
            />
            
          </div>

          {/* ✅ penalties JSON */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ color: "#9a9a9a", fontSize: 12, marginBottom: 6 }}>Penalties (JSON array)</div>
            <textarea
              rows={5}
              value={typeof form.penalties === "string" ? form.penalties : safeJsonStringify(form.penalties)}
              onChange={(e) => setForm({ ...form, penalties: e.target.value })}
              style={{ ...inputStyle, fontFamily: "monospace" }}
            />
          </div>

          {/* ✅ extraData JSON */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ color: "#9a9a9a", fontSize: 12, marginBottom: 6 }}>Extra Data (JSON object)</div>
            <textarea
              rows={4}
              value={typeof form.extraData === "string" ? form.extraData : safeJsonStringify(form.extraData)}
              onChange={(e) => setForm({ ...form, extraData: e.target.value })}
              style={{ ...inputStyle, fontFamily: "monospace" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input id="dnf" type="checkbox" checked={!!form.didNotFinish} onChange={(e) => setForm({ ...form, didNotFinish: e.target.checked })} />
            <label htmlFor="dnf" style={{ color: "white" }}>
              Did Not Finish
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
          After adding results, refresh Leaderboard and you’ll see points change via aggregate.
        </div>
      </Modal>
    </div>
  );
}
