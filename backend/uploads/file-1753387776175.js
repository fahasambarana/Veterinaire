const express = require("express");
const router = express.Router();
const {
  createAppointment,
  getAllAppointments,
  getAppointmentsByOwner, // 👈 Importez cette fonction
  getAppointmentsByVet,   // 👈 Importez cette fonction
  updateAppointmentStatus,
  getAppointmentById,
  deleteAppointment,
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
  // Si le rôle n'est ni pet-owner ni vet, ou si checkRole n'a pas filtré
  res.status(403).json({ message: "Accès refusé pour ce rôle." });
});


router.get("/count/me", checkRole(["pet-owner", "vet"]), countAppointmentsByUser);


// @route   PUT /api/appointments/:id/status
// @desc    Mettre à jour le statut d'un rendez-vous (vétérinaire uniquement)
// @access  Private (vet)
router.put(
  "/:id/status",
  checkRole(["vet"]),
  updateAppointmentStatus
);

// @route   GET /api/appointments/:id
// @desc    Récupérer un rendez-vous spécifique par son ID
// @access  Private (admin, vet, propriétaire si c'est le sien - vérifié dans le contrôleur)
// Placez les routes génériques avec :id APRÈS les routes plus spécifiques
router.get(
  "/:id",
  checkRole(["admin", "vet", "pet-owner"]), // Permettre au propriétaire de voir le sien
  getAppointmentById
);

// @route   DELETE /api/appointments/:id
// @desc    Supprimer un rendez-vous (propriétaire d'animal ou admin)
// @access  Private (pet-owner, admin)
// Le contrôleur doit vérifier que le propriétaire est bien le propriétaire du rendez-vous
router.delete("/:id", checkRole(["pet-owner", "admin"]), deleteAppointment);


module.exports = router;