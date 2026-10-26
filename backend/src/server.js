require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./config/db");

const teamsRoutes = require("./routes/teams.routes");
const driversRoutes = require("./routes/drivers.routes");
const racesRoutes = require("./routes/races.routes");
const resultsRoutes = require("./routes/results.routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({ ok: true, app: "F1 Race Management API" });
});

app.use("/api/teams", teamsRoutes);
app.use("/api/drivers", driversRoutes);
app.use("/api/races", racesRoutes);
app.use("/api/results", resultsRoutes);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`✅ API running: http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌ DB error:", err.message);
    process.exit(1);
  });
