// backend/controllers/notificationController.js

const Notification = require("../models/NotificationsModel");
const mongoose = require("mongoose");

let io;

const setIoInstance = (ioInstance) => {
  io = ioInstance;
};

const createAndEmitNotification = async ({ recipientId, title, message, type, entityId, senderId }) => {
  try {
    if (!recipientId || !title || !message) {
      console.error("Erreur de validation lors de la création d'une notification : données manquantes.");
      return;
    }

    const newNotification = await Notification.create({
      recipient: recipientId,
      title,
      message,
      type,
      entityId,
      senderId,
    });

    // Émettre la notification à l'utilisateur concerné
    if (io) {
      console.log(`Émission d'une nouvelle notification à l'utilisateur ${recipientId}`);
      io.to(recipientId).emit("newNotification", newNotification);
    } else {
      console.warn("L'instance Socket.IO n'est pas disponible pour émettre la notification.");
    }

    return newNotification;

  } catch (error) {
    console.error("Erreur lors de la création ou de l'émission d'une notification :", error);
    throw error;
  }
};

// @desc    Obtenir toutes les notifications de l'utilisateur connecté
// @route   GET /api/notifications/mine
// @access  Privé
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .populate("senderId", "username"); // Populons le nom de l'expéditeur si besoin
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications de l'utilisateur :", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des notifications." });
  }
};

// @desc    Marquer une notification spécifique comme lue
// @route   PUT /api/notifications/:id/read
// @access  Privé
const markAsRead = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "ID de notification invalide." });
    }
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification non trouvée ou non autorisée." });
    }
    res.status(200).json(notification);
  } catch (error) {
    console.error("Erreur lors du marquage comme lu:", error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// @desc    Obtenir une notification par ID (pour un lien)
// @route   GET /api/notifications/:id
// @access  Privé
const getNotificationsByUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "ID de notification invalide." });
    }
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id,
    })
      .populate("senderId", "username")
      .populate("entityId");
    
    if (!notification) {
      return res.status(404).json({ message: "Notification non trouvée ou non autorisée." });
    }
    res.status(200).json(notification);
  } catch (error) {
    console.error("Erreur lors de la récupération de la notification par ID:", error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// @desc    Supprimer une notification spécifique
// @route   DELETE /api/notifications/:id
// @access  Privé
const deleteNotification = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "ID de notification invalide." });
    }
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id,
    });

    if (!notification) {
      return res
        .status(404)
        .json({ message: "Notification non trouvée ou non autorisée." });
    }

    res.status(200).json({ message: "Notification supprimée avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de la notification:", error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// @desc    Supprimer toutes les notifications d'un utilisateur
// @route   DELETE /api/notifications/mine
// @access  Privé
const deleteAllMyNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user.id });
    res
      .status(200)
      .json({ message: "Toutes les notifications ont été supprimées." });
  } catch (error) {
    console.error(
      "Erreur lors de la suppression de toutes les notifications:",
      error
    );
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

module.exports = {
  setIoInstance,
  createAndEmitNotification,
  getMyNotifications,
  markAsRead,
  getNotificationsByUser,
  deleteNotification,
  deleteAllMyNotifications,
};
