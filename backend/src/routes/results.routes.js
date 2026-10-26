// backend/src/routes/results.routes.js
const router = require("express").Router();
const Result = require("../models/Result");
const Team = require("../models/Team");

// CREATE
router.post("/", async (req, res) => {
  try {
    const result = await Result.create(req.body);
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// FIND results (populate)
router.get("/", async (req, res) => {
  try {
    const { raceId } = req.query;
    const filter = {};
    if (raceId) filter.raceId = raceId;

    const results = await Result.find(filter)
      .populate("raceId")
      .populate({
        path: "driverId",
        populate: { path: "teamId" },
      })
      .sort({ position: 1 });

    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * ✅ Aggregate join requirement (LEFT JOIN style)
 * Team leaderboard by seasonYear INCLUDING teams with 0 points (no results)
 *
 * /api/results/leaderboard/teams?seasonYear=2025
 */
router.get("/leaderboard/teams", async (req, res) => {
  try {
    const seasonYear = Number(req.query.seasonYear);
    if (!seasonYear) return res.status(400).json({ error: "seasonYear is required" });

    // Start from Teams so all teams appear even if they have no results
    const data = await Team.aggregate([
      {
        $lookup: {
          from: "results",
          let: { teamId: "$_id" },
          pipeline: [
            // Match results belonging to drivers of this team, in the requested seasonYear
            {
              $lookup: {
                from: "drivers",
                localField: "driverId",
                foreignField: "_id",
                as: "driver",
              },
            },
            { $unwind: "$driver" },
            {
              $match: {
                $expr: { $eq: ["$driver.teamId", "$$teamId"] },
              },
            },
            {
              $lookup: {
                from: "races",
                localField: "raceId",
                foreignField: "_id",
                as: "race",
              },
            },
            { $unwind: "$race" },
            { $match: { "race.seasonYear": seasonYear } },

            // Aggregate points + wins for this team
            {
              $group: {
                _id: "$driver.teamId",
                totalPoints: { $sum: "$pointsAwarded" },
                wins: { $sum: { $cond: [{ $eq: ["$position", 1] }, 1, 0] } },
              },
            },
          ],
          as: "score",
        },
      },
      // If no score exists, keep the team and set score fields to 0
      { $unwind: { path: "$score", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          teamCode: "$code",
          teamName: "$name",
          totalPoints: { $ifNull: ["$score.totalPoints", 0] },
          wins: { $ifNull: ["$score.wins", 0] },
        },
      },
      { $sort: { totalPoints: -1, wins: -1, teamName: 1 } },
    ]);

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// UPDATE result
router.put("/:id", async (req, res) => {
  try {
    const updated = await Result.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: "Result not found" });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});


module.exports = router;
