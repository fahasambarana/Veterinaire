const mongoose = require("mongoose");

const consultationSchema = new mongoose.Schema({
  vetId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  petId: { type: mongoose.Schema.Types.ObjectId, ref: "Pet", required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
  date: { type: Date, default: Date.now },
  weight: Number,
  temperature: Number,
  symptoms: [String],
  diagnosis: String,
  treatment: String,
  notes: String,
});

module.exports = mongoose.model("Consultation", consultationSchema);
