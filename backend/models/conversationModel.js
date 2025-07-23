const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  // Participants de la conversation
  // Pour une conversation entre propriétaire et vétérinaire, il y aura 2 IDs.
  // Les IDs font référence au modèle User (propriétaire ou vétérinaire).
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assurez-vous que 'User' est le nom de votre modèle d'utilisateur
    required: true,
  }],
  
  // Dernier message envoyé dans cette conversation pour un aperçu rapide
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message', // Fera référence au modèle Message que nous allons créer
    required: false, // Sera mis à jour une fois le premier message envoyé
  },
  
  // Horodatage de la création et de la dernière mise à jour de la conversation
}, {
  timestamps: true, // Ajoute automatiquement createdAt et updatedAt
});



const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;