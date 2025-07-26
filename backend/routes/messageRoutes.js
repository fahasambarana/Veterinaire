const express = require('express');
const router = express.Router();
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload'); // Importez votre middleware upload.js

const {
  sendMessage,
  getMessagesInConversation,
  markMessageAsRead
} = require('../controllers/messageController');

router.use(authMiddleware);

router.get('/:conversationId/messages', checkRole(['pet-owner', 'vet']), getMessagesInConversation);

// La route d'envoi de message utilise maintenant le middleware 'upload' importé
// Assurez-vous que le champ 'file' dans FormData correspond à 'upload.single('file')'
router.post(
  '/:conversationId/messages',
  checkRole(['pet-owner', 'vet']),
  upload.single('file'), // 'file' est le nom du champ dans le FormData du frontend
  sendMessage
);

router.put('/:messageId/read', checkRole(['pet-owner', 'vet']), markMessageAsRead);

module.exports = router;
