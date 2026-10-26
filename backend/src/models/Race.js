const mongoose = require("mongoose");

const RaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    circuit: { type: String, required: true, trim: true },

    raceDate: { type: Date, required: true }, // ✅ date
    seasonYear: { type: Number, required: true, min: 1950, max: 2100 },

    lapCount: { type: Number, required: false, min: 1, max: 200 }, // ✅ number max
    isNightRace: { type: Boolean, default: false }, // ✅ boolean
  },
  { timestamps: true }
);

module.exports = mongoose.model("Race", RaceSchema);
