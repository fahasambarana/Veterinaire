const express = require('express');
const router = express.Router();
const { authMiddleware, checkRole } = require('../middleware/authMiddleware'); 

const {
  sendMessage,
  getMessagesInConversation, // ✅ Ajouté ici
  markMessageAsRead
} = require('../controllers/messageController');

// Auth obligatoire pour toutes les routes
router.use(authMiddleware);

// ✅ Récupérer les messages d'une conversation
router.get('/:conversationId/messages', checkRole(['pet-owner', 'vet']), getMessagesInConversation);

// ✅ Envoyer un nouveau message
router.post('/:conversationId/messages', checkRole(['pet-owner', 'vet']), sendMessage);

// ✅ Marquer comme lu
router.put('/:messageId/read', checkRole(['pet-owner', 'vet']), markMessageAsRead);

module.exports = router;
