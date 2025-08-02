// backend/routes/notificationRoute.js

const express = require("express");
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  deleteNotification,
  deleteAllMyNotifications,
  getNotificationsByUser,
} = require("../controllers/notificationController");
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");

// Appliquer le middleware d'authentification à toutes les routes de ce routeur
router.use(authMiddleware);

// @route   GET /api/notifications/mine
// @desc    Obtenir toutes les notifications de l'utilisateur connecté
// @access  Privé
// ATTENTION: C'est la route qui manquait et qui est appelée par le frontend.
router.get("/mine", getMyNotifications);

// @route   GET /api/notifications/:id
// @desc    Obtenir une notification spécifique par son ID
// @access  Privé (vérifie si l'utilisateur est le destinataire)
router.get("/:id", (req, res, next) => {
    // Note: Cette route utilise une vérification simple via le contrôleur pour s'assurer que l'utilisateur est le bon destinataire.
    // Vous pouvez également ajouter un middleware plus spécifique si nécessaire.
    next();
}, getNotificationsByUser);

// @route   PUT /api/notifications/:id/read
// @desc    Marquer une notification spécifique comme lue
// @access  Privé
router.put("/:id/read", markAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Supprimer une notification spécifique
// @access  Privé
router.delete("/:id", deleteNotification);

// @route   DELETE /api/notifications/mine
// @desc    Supprimer toutes les notifications de l'utilisateur
// @access  Privé
router.delete("/mine", deleteAllMyNotifications);

module.exports = router;
