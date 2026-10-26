const router = require("express").Router();
const Driver = require("../models/Driver");

// CREATE
router.post("/", async (req, res) => {
  try {
    const driver = await Driver.create(req.body);
    res.status(201).json(driver);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/**
 * FIND with criteria:
 * - all: /api/drivers
 * - criteria1: teamId => /api/drivers?teamId=...
 * - criteria2: role => /api/drivers?role=MAIN
 * - extra: isActive => /api/drivers?isActive=true
 * - combined: /api/drivers?teamId=...&role=MAIN&isActive=true
 */
router.get("/", async (req, res) => {
  const { teamId, role, isActive } = req.query;

  const filter = {};
  if (teamId) filter.teamId = teamId;
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === "true";

  const drivers = await Driver.find(filter)
    .populate("teamId") // ✅ populate
    .sort({ points: -1, createdAt: -1 });

  res.json(drivers);
});

// READ one
router.get("/:id", async (req, res) => {
  const driver = await Driver.findById(req.params.id).populate("teamId");
  if (!driver) return res.status(404).json({ error: "Driver not found" });
  res.json(driver);
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const updated = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("teamId");

    if (!updated) return res.status(404).json({ error: "Driver not found" });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE (optional)
router.delete("/:id", async (req, res) => {
  const deleted = await Driver.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Driver not found" });
  res.json({ ok: true });
});

module.exports = router;
