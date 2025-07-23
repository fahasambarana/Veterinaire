const express = require('express');
const router = express.Router();
const { authMiddleware, checkRole } = require('../middleware/authMiddleware'); 
const {
  createOrGetConversation,
  getConversationsForUser,
  getConversationById,
  getMessagesInConversation, // Gardez ceci
  // REMOVE sendMessage, il n'est plus dans conversationController
} = require('../controllers/conversationController'); 

router.use(authMiddleware);

// @route   POST /api/conversations
router.post('/', checkRole(['pet-owner', 'vet']), createOrGetConversation);

// @route   GET /api/conversations/mine
router.get('/mine', checkRole(['pet-owner', 'vet']), getConversationsForUser);

// @route   GET /api/conversations/:id
router.get('/:id', checkRole(['pet-owner', 'vet']), getConversationById);

// 🚨 Gardez cette route GET pour les messages dans ce fichier
// @route   GET /api/conversations/:conversationId/messages
router.get('/:conversationId/messages', checkRole(['pet-owner', 'vet', 'admin']), getMessagesInConversation);

// 🚨🚨🚨 TRÈS IMPORTANT : SUPPRIMEZ TOUTE LIGNE SIMILAIRE À CELLE-CI DE CE FICHIER 🚨🚨🚨
// router.post('/:conversationId/messages', checkRole(['pet-owner', 'vet']), sendMessage); 

module.exports = router;