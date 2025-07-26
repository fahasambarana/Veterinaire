const express = require("express");
const {
  createConsultation,
  getConsultationsByPet,
  getAllConsultations,
  getConsultationById,
  updateConsultation,
  countConsultations, // Importer la fonction de comptage
} = require("../controllers/consultationController"); // Assurez-vous que ces fonctions sont exportées
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");

const router = express.Router();

// Appliquer authMiddleware à toutes les routes de ce routeur
router.use(authMiddleware);

// 1. Route pour créer une nouvelle consultation
router.post("/", checkRole(["vet", "admin"]), createConsultation);

// 2. Route pour obtenir TOUTES les consultations
router.get("/all", checkRole(["vet", "admin"]), getAllConsultations);

// 3. Route pour obtenir les consultations par ID d'animal
router.get("/pet/:petId", checkRole(["pet-owner", "vet", "admin"]), getConsultationsByPet);

// 4. Route pour obtenir une seule consultation par son ID
router.get("/:id", checkRole(["pet-owner", "vet", "admin"]), getConsultationById);

// 5. Route pour mettre à jour une consultation existante par son ID
router.put("/:id", checkRole(["vet", "admin"]), updateConsultation);

// 6. Route pour obtenir le nombre total de consultations
router.get("/count", checkRole(["vet", "admin"]), countConsultations);

// REMARQUE IMPORTANTE : Les routes pour les ordonnances ont été retirées d'ici.
// Elles doivent être définies et gérées UNIQUEMENT dans 'ordonnanceRoutes.js'
// pour une meilleure séparation des préoccupations et éviter les conflits de routes.
// Assurez-vous que votre fichier 'ordonnanceRoutes.js' inclut toutes les routes nécessaires
// pour la création, la récupération, la modification et la suppression des ordonnances.

module.exports = router;
