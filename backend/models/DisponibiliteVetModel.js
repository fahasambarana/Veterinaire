const mongoose = require('mongoose');

const disponibiliteSchema = new mongoose.Schema({
  vetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Référence à l'utilisateur avec le rôle "vet"
    required: true
  },
  date_debut: {
    type: Date,
    required: true
  },
  date_fin: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['Disponible', 'Indisponible'],
    default: 'Disponible'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Disponibilite', disponibiliteSchema);
