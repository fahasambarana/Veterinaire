// models/appointmentModel.js
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pet",
    required: true,
  },
  vetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // utilisateur avec rôle "vet"
    required: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  reason: {
    type: String,
  },
  status: {
    type: String,
    enum: ["en attente", "confirmé", "annulé", "terminé"],
    default: "en attente",
  },
}, { timestamps: true });

module.exports = mongoose.model("Appointment", appointmentSchema);
