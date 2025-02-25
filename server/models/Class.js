const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  timeSlot: { type: Date, required: true },
  zoomLink: { type: String, required: true },
  status: { type: String, enum: ["upcoming", "canceled", "archived"], default: "upcoming" },
  notes: { type: String },
});

module.exports = mongoose.model("Class", classSchema);
