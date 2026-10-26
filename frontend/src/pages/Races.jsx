import { useEffect, useState } from "react";
import { api } from "../api/client.js";

const box = { background: "#121218", border: "1px solid #222", borderRadius: 14 };
const inputStyle = { padding: 10, borderRadius: 10, border: "1px solid #333", background: "#0f0f14", color: "white", width: "100%" };
const btnRed = { padding: "10px 14px", borderRadius: 10, border: "none", background: "#d90429", color: "white", fontWeight: 800, cursor: "pointer" };
const btnGhost = { padding: "10px 14px", borderRadius: 10, border: "1px solid #333", background: "transparent", color: "white", fontWeight: 700, cursor: "pointer" };

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "grid", placeItems: "center", zIndex: 9999, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(760px, 100%)", background: "#0b0b0f", border: "1px solid #222", borderRadius: 16, padding: 16, color: "white" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={btnGhost}>Close</button>
        </div>
        <div style={{ marginTop: 14 }}>{children}</div>
      </div>
    </div>
  );
}

export default function Races() {
  const [seasonYear, setSeasonYear] = useState(2025);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [saving, setSaving] = useState(false);

  const empty = {
    _id: "",
    name: "",
    circuit: "",
    country: "",
    seasonYear: 2025,
    raceDate: "2025-03-01",
    isSprintWeekend: false, // Boolean field
    sessions: ["FP1", "Qualifying", "Race"], // Array field
    meta: { notes: "Created from UI" }, // JSON field
  };
  const [form, setForm] = useState(empty);

  async function load() {
    try {
      setErr("");
      setLoading(true);
      const res = await api.get(`/races?seasonYear=${seasonYear}`);
      setRaces(res.data);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to load races");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/races?seasonYear=${seasonYear}`);
        if (!cancelled) setRaces(res.data);
      } catch (e) {
        if (!cancelled) setErr(e?.response?.data?.error || e?.message || "Failed to load races");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => (cancelled = true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setMode("create");
    setForm({ ...empty, seasonYear: Number(seasonYear) || 2025 });
    setOpen(true);
  }

  function openEdit(r) {
    setMode("edit");
    setForm({
      _id: r._id,
      name: r.name || "",
      circuit: r.circuit || "",
      country: r.country || "",
      seasonYear: r.seasonYear || Number(seasonYear) || 2025,
      raceDate: r.raceDate ? String(r.raceDate).slice(0, 10) : "2025-03-01",
      isSprintWeekend: !!r.isSprintWeekend,
      sessions: Array.isArray(r.sessions) ? r.sessions : ["FP1", "Qualifying", "Race"],
      meta: r.meta || { notes: "" },
    });
    setOpen(true);
  }

  async function submit() {
    try {
      setSaving(true);
      setErr("");

      // parse sessions (Array)
      const sessions = form.sessions
        .map((s) => String(s).trim())
        .filter(Boolean);

      // meta JSON
      let metaObj = form.meta;
      if (typeof form.meta === "string") {
        metaObj = JSON.parse(form.meta);
      }

      const payload = {
        name: form.name,
        circuit: form.circuit,
        country: form.country,
        seasonYear: Number(form.seasonYear),
        raceDate: form.raceDate,
        isSprintWeekend: !!form.isSprintWeekend,
        sessions,
        meta: metaObj,
      };

      if (!payload.name) throw new Error("Race name is required");

      if (mode === "create") await api.post("/races", payload);
      else await api.put(`/races/${form._id}`, payload);

      setOpen(false);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <h1 style={{ color: "white", margin: 0 }}>Races</h1>
        <div style={{ flex: 1 }} />
        <input type="number" value={seasonYear} onChange={(e) => setSeasonYear(e.target.value)} style={{ ...inputStyle, width: 120 }} />
        <button onClick={load} style={btnGhost}>Load</button>
        <button onClick={openCreate} style={btnRed}>+ Add Race</button>
      </div>

      {err && <div style={{ color: "#ff6b6b", marginBottom: 10 }}>{err}</div>}

      <div style={box}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 140px 140px 120px", padding: 12, color: "#9a9a9a", fontWeight: 800 }}>
          <div>Race</div><div>Circuit</div><div>Date</div><div>Sprint</div><div>Actions</div>
        </div>

        {loading ? (
          <div style={{ padding: 12, color: "white" }}>Loading...</div>
        ) : races.length === 0 ? (
          <div style={{ padding: 12, color: "white" }}>No races for this season year.</div>
        ) : (
          races.map((r) => (
            <div key={r._id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 140px 140px 120px", padding: 12, borderTop: "1px solid #222", color: "white", alignItems: "center" }}>
              <div style={{ fontWeight: 900 }}>{r.name}</div>
              <div style={{ color: "#cfcfcf" }}>{r.circuit}</div>
              <div>{String(r.raceDate).slice(0, 10)}</div>
              <div>{r.isSprintWeekend ? "Yes" : "No"}</div>
              <div><button onClick={() => openEdit(r)} style={btnGhost}>Edit</button></div>
            </div>
          ))
        )}
      </div>

      <Modal open={open} title={mode === "create" ? "Add Race" : "Edit Race"} onClose={() => !saving && setOpen(false)}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input placeholder="Race name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          <input placeholder="Circuit" value={form.circuit} onChange={(e) => setForm({ ...form, circuit: e.target.value })} style={inputStyle} />
          <input placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} style={inputStyle} />
          <input type="number" placeholder="Season year" value={form.seasonYear} onChange={(e) => setForm({ ...form, seasonYear: e.target.value })} style={inputStyle} />
          <input type="date" value={form.raceDate} onChange={(e) => setForm({ ...form, raceDate: e.target.value })} style={inputStyle} />
          <label style={{ display: "flex", gap: 10, alignItems: "center", color: "white" }}>
            <input type="checkbox" checked={!!form.isSprintWeekend} onChange={(e) => setForm({ ...form, isSprintWeekend: e.target.checked })} />
            Sprint weekend
          </label>

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ color: "#9a9a9a", fontSize: 12, marginBottom: 6 }}>Sessions (Array)</div>
            <input
              value={Array.isArray(form.sessions) ? form.sessions.join(", ") : ""}
              onChange={(e) => setForm({ ...form, sessions: e.target.value.split(",") })}
              placeholder="FP1, Qualifying, Race"
              style={inputStyle}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ color: "#9a9a9a", fontSize: 12, marginBottom: 6 }}>Meta JSON</div>
            <textarea
              rows={4}
              value={typeof form.meta === "string" ? form.meta : JSON.stringify(form.meta, null, 2)}
              onChange={(e) => setForm({ ...form, meta: e.target.value })}
              style={{ ...inputStyle, fontFamily: "monospace" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button disabled={saving} onClick={submit} style={btnRed}>{saving ? "Saving..." : "Save"}</button>
          <button disabled={saving} onClick={() => setOpen(false)} style={btnGhost}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
