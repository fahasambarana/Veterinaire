const express = require("express");
const router = express.Router();
const {
  createAppointment,
  getAllAppointments,
  getAppointmentsByOwner,
  getAppointmentsByVet,
  updateAppointmentStatus,
  getAppointmentById,
  // La fonction pour annuler un rendez-vous a été renommée
  // pour mieux refléter son action (mise à jour du statut)
  cancelAppointment, 
  countAppointmentsByUser
} = require("../controllers/appointmentController");

const { authMiddleware, checkRole } = require("../middleware/authMiddleware");

// Appliquer le middleware d'authentification à toutes les routes de ce routeur
router.use(authMiddleware);

router.post("/create", checkRole(["pet-owner"]), createAppointment);

router.get(
  "/all",
  checkRole(["admin", "vet"]),
  getAllAppointments
);

router.get("/mine", checkRole(["pet-owner", "vet"]), (req, res, next) => {
  if (req.user.role === 'pet-owner') {
    return getAppointmentsByOwner(req, res, next);
  } else if (req.user.role === 'vet') {
    return getAppointmentsByVet(req, res, next);
  }
  res.status(403).json({ message: "Accès refusé pour ce rôle." });
});

router.get("/count/me", checkRole(["pet-owner", "vet"]), countAppointmentsByUser);

// @route   PUT /api/appointments/:id/status
// @desc    Mettre à jour le statut d'un rendez-vous (vétérinaire ou admin)
// @access  Private (vet, admin)
// Note: Le contrôleur supporte les deux rôles, nous ajustons donc le middleware
router.put(
  "/:id/status",
  checkRole(["vet", "admin"]),
  updateAppointmentStatus
);

router.get(
  "/:id",
  checkRole(["admin", "vet", "pet-owner"]),
  getAppointmentById
);

// @route   PUT /api/appointments/:id/cancel
// @desc    Annuler un rendez-vous (owner ou admin)
// @access  Private (pet-owner, admin)
// Note: Le contrôleur met à jour le statut, donc PUT est plus approprié que DELETE.
// Nous utilisons une route plus descriptive pour l'annulation.
router.put(
  "/:id/cancel",
  checkRole(["pet-owner", "admin"]),
  cancelAppointment
);

module.exports = router;
