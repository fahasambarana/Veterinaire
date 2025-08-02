// backend/models/ConsultationModel.js

const mongoose = require("mongoose");

const consultationSchema = new mongoose.Schema(
  {
    vetId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    petId: { type: mongoose.Schema.Types.ObjectId, ref: "Pet", required: true },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Le champ 'date' est désormais bien présent pour stocker la date de la consultation
    date: { 
      type: Date, 
      required: true 
    },
    weight: Number,
    temperature: Number,
    symptoms: [String],
    diagnosis: { type: String, required: true },
    treatment: String,
    notes: String,
  },
  {
    timestamps: true, // Ajoute automatiquement les champs createdAt et updatedAt
  }
);

module.exports = mongoose.model("Consultation", consultationSchema);
