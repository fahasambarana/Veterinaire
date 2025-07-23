// backend/models/OrdonnanceModel.js
const mongoose = require('mongoose');

const medicamentSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  dosage: String,
  frequence: String,
  duree: String,
  instructions: String,
}, { _id: false }); // _id: false pour ne pas créer d'ID unique pour chaque médicament dans le tableau

const ordonnanceSchema = new mongoose.Schema({
  consultationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation',
    required: true,
  },
  vetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Référence au modèle User pour le vétérinaire
    required: true,
  },
  dateEmission: {
    type: Date,
    default: Date.now,
  },
  medicaments: [medicamentSchema],
  notesSpeciales: String,
});

module.exports = mongoose.model('Ordonnance', ordonnanceSchema);