const router = require("express").Router();
const Race = require("../models/Race");

// CREATE race
router.post("/", async (req, res) => {
  try {
    const race = await Race.create(req.body);
    res.status(201).json(race);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// GET all races (supports filtering by seasonYear)
router.get("/", async (req, res) => {
  try {
    const { seasonYear } = req.query;
    const filter = {};
    if (seasonYear) filter.seasonYear = Number(seasonYear);

    const races = await Race.find(filter).sort({ raceDate: 1 });
    res.json(races);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// UPDATE race
router.put("/:id", async (req, res) => {
  try {
    const updated = await Race.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: "Race not found" });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
