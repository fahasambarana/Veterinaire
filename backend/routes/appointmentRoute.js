const express = require("express");
const router = express.Router();
const {
  createAppointment,
  getAllAppointments,
  updateAppointmentStatus,
} = require("../controllers/appointmentController");
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");

// Créer un rendez-vous (client uniquement)
router.post("/create", authMiddleware, checkRole(["pet-owner"]), createAppointment);

// Récupérer tous les rendez-vous (admin, vet, client)
router.get(
  "/all",
  authMiddleware,
  checkRole(["admin", "vet"]),
  getAllAppointments
);

// Mettre à jour le statut d’un rendez-vous (vet uniquement)
router.put(
  "/:id/status",
  authMiddleware,
  checkRole(["vet"]),
  updateAppointmentStatus
);

module.exports = router;
