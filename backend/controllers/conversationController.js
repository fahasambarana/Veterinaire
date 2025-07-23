// backend/controllers/conversationController.js
const Conversation = require('../models/conversationModel');
const Message = require('../models/messageModel');
const User = require('../models/userModel'); // Pour peupler les informations de l'expéditeur

// @desc    Créer ou récupérer une conversation entre deux utilisateurs
// @route   POST /api/conversations
// @access  Private
exports.createOrGetConversation = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user.id; // L'ID de l'utilisateur connecté (celui qui initie)

    // Assurez-vous que l'expéditeur n'essaie pas de converser avec lui-même
    if (senderId === recipientId) {
      return res.status(400).json({ message: "Vous ne pouvez pas démarrer une conversation avec vous-même." });
    }

    // Vérifier si une conversation existe déjà entre ces deux participants
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] }
    });

    if (conversation) {
      // Si la conversation existe, on la retourne
      // Optionnel: Mettre à jour 'updatedAt' même si aucun message n'est envoyé, pour la faire remonter
      conversation.updatedAt = Date.now();
      await conversation.save();
      return res.status(200).json(conversation);
    }

    // Si aucune conversation n'existe, on en crée une nouvelle
    conversation = new Conversation({
      participants: [senderId, recipientId]
    });

    await conversation.save();
    res.status(201).json(conversation);
  } catch (error) {
    console.error("Erreur lors de la création/récupération de la conversation:", error);
    res.status(500).json({ message: "Erreur serveur lors de la création/récupération de la conversation." });
  }
};

// @desc    Récupérer toutes les conversations de l'utilisateur connecté
// @route   GET /api/conversations/mine
// @access  Private
exports.getConversationsForUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'username role profilePicture') // Ajoutez profilePicture ici
      .populate('lastMessage') // 🚨 AJOUTEZ CELA pour populer le message complet
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Erreur lors de la récupération des conversations:", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des conversations." });
  }
};
// @desc    Récupérer une conversation spécifique par son ID
// @route   GET /api/conversations/:id
// @access  Private
exports.getConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(id).populate('participants', 'username role profilePicture'); // <-- Standardisé à 'profilePicture'

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée.' });
    }

    // Vérifier que l'utilisateur est bien un participant de cette conversation
    if (!conversation.participants.some(p => p._id.toString() === userId.toString())) {
      return res.status(403).json({ message: 'Accès refusé. Vous n\'êtes pas autorisé à voir cette conversation.' });
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error("Erreur lors de la récupération de la conversation par ID:", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération de la conversation." });
  }
};

// @desc    Récupérer tous les messages d'une conversation spécifique
// @route   GET /api/conversations/:conversationId/messages
// @access  Private
exports.getMessagesInConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id; // L'ID de l'utilisateur connecté

    // Vérifier que la conversation existe et que l'utilisateur est un participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée.' });
    }
    // Convertir l'ID de l'utilisateur en chaîne pour la comparaison
    if (!conversation.participants.map(p => p.toString()).includes(userId.toString())) {
      return res.status(403).json({ message: 'Accès refusé. Vous n\'êtes pas autorisé à voir cette conversation.' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('senderId', 'username profilePicture') // <-- Standardisé à 'profilePicture'
      .sort({ createdAt: 1 }); // Triés par ordre chronologique

    // Optionnel: Marquer les messages comme lus par l'utilisateur qui les récupère
    await Message.updateMany(
      {
        conversation: conversationId,
        senderId: { $ne: userId }, // Ne pas marquer ses propres messages
        readBy: { $ne: userId } // Seulement si l'utilisateur ne l'a pas déjà lu
      },
      { $addToSet: { readBy: userId } }
    );

    res.status(200).json(messages);
  } catch (error) {
    console.error("Erreur lors de la récupération des messages:", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des messages." });
  }
};

// 🚨🚨🚨 CETTE FONCTION EST SUPPRIMÉE DE CE FICHIER 🚨🚨🚨
// exports.sendMessage = ...