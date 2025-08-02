const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      'new_message',
      'appointment_created',
      'appointment_approved',
      'appointment_cancelled',
      'appointment_rejected',
      'appointment_completed',
      'generic',
      // Ajoutez d'autres types de notifications si nécessaire
    ],
    default: 'generic',
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    // Permet de lier la notification à une entité spécifique (ex: un rendez-vous)
    // Ne pas ajouter 'ref' ici pour ne pas avoir de validation strict
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notification', notificationSchema);
