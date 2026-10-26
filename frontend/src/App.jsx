import { Routes, Route } from "react-router-dom";
import DashboardLayout from "./layout/DashboardLayout";

import Dashboard from "./pages/Dashboard";
import Teams from "./pages/Teams";
import Drivers from "./pages/Drivers";
import Races from "./pages/Races";
import Results from "./pages/Results";
import Leaderboard from "./pages/Leaderboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="teams" element={<Teams />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="races" element={<Races />} />
        <Route path="results" element={<Results />} />
        <Route path="leaderboard" element={<Leaderboard />} />
      </Route>
    </Routes>
  );
}
