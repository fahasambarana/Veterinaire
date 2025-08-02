// backend/routes/consultationRoutes.js
const express = require("express");
const router = express.Router();
const {
  createConsultation,
  getConsultationsByPet,
  getAllConsultations,
  getConsultationById,
  updateConsultation,
  countConsultations,
} = require("../controllers/consultationController");

// Assurez-vous que ces middlewares existent et sont correctement exportés
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");

// Appliquer le middleware d'authentification à toutes les routes de ce routeur
router.use(authMiddleware);

// 1. Route pour créer une nouvelle consultation
// Accès : Privé (vet, admin)
router.post("/", checkRole(["vet", "admin"]), createConsultation);

// 2. Route pour obtenir TOUTES les consultations
// Accès : Privé (vet, admin)
router.get("/all", checkRole(["vet", "admin"]), getAllConsultations);

// 3. Route pour obtenir les consultations par ID d'animal
// Accès : Privé (pet-owner, vet, admin)
router.get("/pet/:petId", checkRole(["pet-owner", "vet", "admin"]), getConsultationsByPet);

// 4. Route pour obtenir le nombre total de consultations
// Accès : Privé (vet, admin)
router.get("/count", checkRole(["vet", "admin"]), countConsultations);

// 5. Route pour obtenir une seule consultation par son ID
// Accès : Privé (pet-owner, vet, admin)
// NOTE : Cette route doit être placée après les routes plus spécifiques comme "/all" ou "/count"
// pour éviter que l'ID ne soit confondu avec un de ces mots-clés.
router.get("/:id", checkRole(["pet-owner", "vet", "admin"]), getConsultationById);

// 6. Route pour mettre à jour une consultation existante par son ID
// Accès : Privé (vet, admin)
router.put("/:id", checkRole(["vet", "admin"]), updateConsultation);

module.exports = router;
