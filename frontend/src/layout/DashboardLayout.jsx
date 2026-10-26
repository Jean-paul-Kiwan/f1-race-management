import { NavLink, Outlet } from "react-router-dom";

const linkStyle = ({ isActive }) => ({
  display: "block",
  padding: "10px 12px",
  borderRadius: 10,
  textDecoration: "none",
  color: isActive ? "white" : "#c9c9c9",
  background: isActive ? "#d90429" : "transparent",
  fontWeight: 600,
});

export default function DashboardLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%", background: "#0b0b0f" }}>
      <aside
        style={{
          width: 260,
          padding: 18,
          borderRight: "1px solid #222",
          background: "#0b0b0f",
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <div style={{ color: "white", fontSize: 18, fontWeight: 800 }}>
            F1 Race Manager
          </div>
          <div style={{ color: "#8a8a8a", fontSize: 12 }}>
            React + Node + MongoDB
          </div>
        </div>

        <nav style={{ display: "grid", gap: 8 }}>
          <NavLink to="/" end style={linkStyle}>Dashboard</NavLink>
          <NavLink to="/teams" style={linkStyle}>Teams</NavLink>
          <NavLink to="/drivers" style={linkStyle}>Drivers</NavLink>
          <NavLink to="/races" style={linkStyle}>Races</NavLink>
          <NavLink to="/results" style={linkStyle}>Results</NavLink>
          <NavLink to="/leaderboard" style={linkStyle}>Leaderboard</NavLink>
        </nav>
      </aside>

      <main
  style={{
    flex: 1,
    padding: 22,
    width: "100%",
    minWidth: 0,     // IMPORTANT for flex layouts
  }}
>
  <Outlet />
</main>

    </div>
  );
}
