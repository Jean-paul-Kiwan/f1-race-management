const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true, // ✅ first string field constraint
      trim: true,
      unique: true,
      minlength: 2,
      maxlength: 5,
    },
    name: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },

    isActive: { type: Boolean, default: true }, // ✅ boolean
    sponsors: [{ type: String, trim: true }],   // ✅ array

    carSpecs: {
      engineSupplier: { type: String, trim: true },
      horsepower: { type: Number, max: 1500 },  // ✅ max value example
      notes: { type: String, default: "" },
    }, // ✅ JSON-like object

    metadata: {
      type: mongoose.Schema.Types.Mixed, // ✅ JSON/Mixed
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", TeamSchema);
