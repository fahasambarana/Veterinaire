const Message = require("../models/messageModel");
const Conversation = require("../models/conversationModel");

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, messageType = 'text', fileUrl } = req.body;
    const senderId = req.user.id;

    if (!content) {
      return res.status(400).json({ message: "Le contenu du message est requis." });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée.' });
    }

    if (!conversation.participants.map(p => p.toString()).includes(senderId.toString())) {
      return res.status(403).json({ message: 'Accès refusé. Vous ne participez pas à cette conversation.' });
    }

    const newMessage = new Message({
      conversation: conversationId,
      senderId,
      content,
      messageType,
      fileUrl: messageType !== 'text' ? fileUrl : undefined,
    });

    await newMessage.save();

    conversation.lastMessage = newMessage._id;
    conversation.updatedAt = Date.now();
    await conversation.save();

    const io = req.app.get('io');
    const populatedMessage = await Message.findById(newMessage._id).populate('senderId', 'username profilePicture');

    if (io) {
      io.to(conversationId).emit('newMessage', populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Erreur lors de l'envoi du message:", error.message);
    res.status(500).json({ message: "Erreur serveur lors de l'envoi du message", error: error.message });
  }
};

// ✅ Remis ici
exports.getMessagesInConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation non trouvée." });
    }

    if (!conversation.participants.map(p => p.toString()).includes(userId.toString())) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('senderId', 'username profilePicture')
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Erreur lors de la récupération des messages :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

exports.markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message non trouvé." });
    }

    const conversation = await Conversation.findById(message.conversation);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation associée non trouvée." });
    }

    const isParticipant = conversation.participants
      .map((p) => p.toString())
      .includes(userId.toString());

    if (!isParticipant) {
      return res.status(403).json({ message: "Vous n'avez pas accès à ce message." });
    }

    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await message.save();
    }

    res.status(200).json({ message: "Message marqué comme lu." });
  } catch (error) {
    console.error("Erreur marquage lu:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
