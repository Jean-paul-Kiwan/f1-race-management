const router = require("express").Router();
const Team = require("../models/Team");

// CREATE
router.post("/", async (req, res) => {
  try {
    const team = await Team.create(req.body);
    res.status(201).json(team);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// READ all
router.get("/", async (req, res) => {
  const teams = await Team.find().sort({ createdAt: -1 });
  res.json(teams);
});

// READ one
router.get("/:id", async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ error: "Team not found" });
  res.json(team);
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const updated = await Team.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: "Team not found" });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE (optional)
router.delete("/:id", async (req, res) => {
  const deleted = await Team.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Team not found" });
  res.json({ ok: true });
});

module.exports = router;
