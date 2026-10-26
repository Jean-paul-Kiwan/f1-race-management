// frontend/src/pages/Leaderboard.jsx
import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function Leaderboard() {
  const [seasonYear, setSeasonYear] = useState(2025);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    try {
      setErr("");
      setLoading(true);
      const res = await api.get(`/results/leaderboard/teams?seasonYear=${seasonYear}`);
      setRows(res.data);
    } catch (e) {
      setErr(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  // ✅ React 19-friendly: do async work inside the effect (avoid sync setState in effect body)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setErr("");
        setLoading(true);

        const res = await api.get(`/results/leaderboard/teams?seasonYear=${seasonYear}`);
        if (!cancelled) setRows(res.data);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // run only once on mount:
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
  <div style={{ width: "100%" }}>
      <h1 style={{ color: "white", marginBottom: 10 }}>Team Leaderboard</h1>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
        <input
          value={seasonYear}
          onChange={(e) => setSeasonYear(e.target.value)}
          type="number"
          style={{
            width: 120,
            padding: 10,
            borderRadius: 10,
            border: "1px solid #333",
            background: "#121218",
            color: "white",
          }}
        />
        <button
          onClick={load}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            background: "#d90429",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Load
        </button>
      </div>

      {err && <div style={{ color: "#ff6b6b", marginBottom: 10 }}>{err}</div>}

      <div style={{ background: "#121218", border: "1px solid #222", borderRadius: 14 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "80px 120px 1fr 140px 100px",
            padding: 12,
            color: "#9a9a9a",
            fontWeight: 700,
          }}
        >
          <div>#</div>
          <div>Code</div>
          <div>Team</div>
          <div>Points</div>
          <div>Wins</div>
        </div>

        {loading ? (
          <div style={{ padding: 12, color: "white" }}>Loading...</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 12, color: "white" }}>
            No data. Try another season year (ex: 2025) and click Load.
          </div>
        ) : (
          rows.map((r, idx) => (
            <div
              key={r._id}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 120px 1fr 140px 100px",
                padding: 12,
                borderTop: "1px solid #222",
                color: "white",
              }}
            >
              <div>{idx + 1}</div>
              <div style={{ fontWeight: 800 }}>{r.teamCode}</div>
              <div>{r.teamName}</div>
              <div style={{ fontWeight: 800 }}>{r.totalPoints}</div>
              <div>{r.wins}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
