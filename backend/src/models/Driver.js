const mongoose = require("mongoose");

const DriverSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },

    role: {
      type: String,
      enum: ["MAIN", "RESERVE", "TEST"], // ✅ enum constraint (second string field)
      required: true,
    },

    raceNumber: { type: Number, required: true, min: 1, max: 99 }, // ✅ integer-like
    dob: { type: Date, required: true }, // ✅ date

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"], // ✅ validation rule
    },

    points: { type: Number, default: 0, max: 2000 }, // ✅ max value
    isActive: { type: Boolean, default: true },

    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team", // ✅ foreign key
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Driver", DriverSchema);
