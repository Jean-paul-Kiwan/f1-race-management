// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { api } from "../api/client.js";

const card = {
  background: "#121218",
  border: "1px solid #222",
  borderRadius: 14,
  padding: 14,
};

const title = { color: "white", margin: 0, fontSize: 22, fontWeight: 900 };
const sub = { color: "#9a9a9a", marginTop: 6 };

function StatCard({ label, value }) {
  return (
    <div style={card}>
      <div style={{ color: "#9a9a9a", fontSize: 12, fontWeight: 800 }}>{label}</div>
      <div style={{ color: "white", fontSize: 26, fontWeight: 900, marginTop: 6 }}>{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [seasonYear, setSeasonYear] = useState(2025);

  const [teamsCount, setTeamsCount] = useState(0);
  const [driversCount, setDriversCount] = useState(0);
  const [racesCount, setRacesCount] = useState(0);
  const [resultsCount, setResultsCount] = useState(0);

  const [topTeam, setTopTeam] = useState(null);
  const [recentRaces, setRecentRaces] = useState([]);

  async function load() {
    try {
      setErr("");
      setLoading(true);

      // Load multiple endpoints in parallel
      const [teamsRes, driversRes, racesRes, resultsRes, lbRes] = await Promise.all([
        api.get("/teams"),
        api.get("/drivers"),
        api.get(`/races?seasonYear=${seasonYear}`),
        api.get("/results"),
        api.get(`/results/leaderboard/teams?seasonYear=${seasonYear}`),
      ]);

      const races = racesRes.data || [];
      const leaderboard = lbRes.data || [];

      setTeamsCount((teamsRes.data || []).length);
      setDriversCount((driversRes.data || []).length);
      setRacesCount(races.length);
      setResultsCount((resultsRes.data || []).length);

      setTopTeam(leaderboard.length ? leaderboard[0] : null);

      // Recent races (first 5 by date)
      const sorted = [...races].sort((a, b) => String(a.raceDate).localeCompare(String(b.raceDate)));
      setRecentRaces(sorted.slice(0, 5));
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonYear]);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <div>
          <h1 style={title}>Dashboard</h1>
          <div style={sub}>
            Quick overview (counts + leaderboard + recent races). Uses API + MongoDB aggregate.
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ color: "#9a9a9a", fontWeight: 800 }}>Season</div>
          <input
            type="number"
            value={seasonYear}
            onChange={(e) => setSeasonYear(Number(e.target.value) || 2025)}
            style={{
              width: 120,
              padding: 10,
              borderRadius: 10,
              border: "1px solid #333",
              background: "#0f0f14",
              color: "white",
            }}
          />
          <button
            onClick={load}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #333",
              background: "transparent",
              color: "white",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {err && <div style={{ color: "#ff6b6b", marginBottom: 12 }}>{err}</div>}

      {loading ? (
        <div style={{ color: "white" }}>Loading...</div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
            <StatCard label="Teams" value={teamsCount} />
            <StatCard label="Drivers" value={driversCount} />
            <StatCard label={`Races (${seasonYear})`} value={racesCount} />
            <StatCard label="Results" value={resultsCount} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12 }}>
            {/* Top team */}
            <div style={card}>
              <div style={{ color: "#9a9a9a", fontSize: 12, fontWeight: 800 }}>Top Team (Aggregate Leaderboard)</div>
              {topTeam ? (
                <div style={{ marginTop: 10 }}>
                  <div style={{ color: "white", fontSize: 18, fontWeight: 900 }}>
                    {topTeam.teamCode} — {topTeam.teamName}
                  </div>
                  <div style={{ color: "#cfcfcf", marginTop: 6 }}>
                    Points: <b style={{ color: "white" }}>{topTeam.totalPoints}</b> • Wins:{" "}
                    <b style={{ color: "white" }}>{topTeam.wins}</b>
                  </div>
                  <div style={{ color: "#9a9a9a", marginTop: 10, fontSize: 12 }}>
                    This is computed from MongoDB using <b>aggregate()</b> + <b>$lookup</b> + <b>$group</b>.
                  </div>
                </div>
              ) : (
                <div style={{ color: "white", marginTop: 10 }}>No leaderboard data yet.</div>
              )}
            </div>

            {/* Recent races */}
            <div style={card}>
              <div style={{ color: "#9a9a9a", fontSize: 12, fontWeight: 800 }}>Upcoming / Recent Races</div>
              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                {recentRaces.length ? (
                  recentRaces.map((r) => (
                    <div
                      key={r._id}
                      style={{
                        border: "1px solid #222",
                        borderRadius: 12,
                        padding: 10,
                        background: "#0f0f14",
                      }}
                    >
                      <div style={{ color: "white", fontWeight: 900 }}>{r.name}</div>
                      <div style={{ color: "#cfcfcf", fontSize: 13 }}>
                        {r.circuit} • {String(r.raceDate).slice(0, 10)} • {r.isSprintWeekend ? "Sprint" : "Normal"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: "white" }}>No races for {seasonYear}.</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
