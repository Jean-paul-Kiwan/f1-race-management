const mongoose = require("mongoose");

const ResultSchema = new mongoose.Schema(
  {
    raceId: { type: mongoose.Schema.Types.ObjectId, ref: "Race", required: true },   // ✅ FK
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true }, // ✅ FK

    position: { type: Number, required: true, min: 1, max: 20 },
    pointsAwarded: { type: Number, required: true, min: 0, max: 25 },

    tyreStints: [
      {
        compound: { type: String, enum: ["SOFT", "MEDIUM", "HARD", "INTER", "WET"] },
        laps: { type: Number, min: 1, max: 200 },
      },
    ], // ✅ array of objects

    penalties: {
      type: mongoose.Schema.Types.Mixed, // ✅ JSON/Mixed (example: { seconds: 5, reason: "Track limits" })
      default: {},
    },
  },
  { timestamps: true }
);

// 1 result per driver per race
ResultSchema.index({ raceId: 1, driverId: 1 }, { unique: true });

module.exports = mongoose.model("Result", ResultSchema);
