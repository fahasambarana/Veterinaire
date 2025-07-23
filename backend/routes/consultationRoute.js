// backend/routes/consultation.routes.js
const express = require("express");
const {
  createConsultation,
  getConsultationsByPet,
  getAllConsultations,
  getConsultationById,
  updateConsultation,
  addOrdonnanceToConsultation, // <-- NOUVEAU: Importer la nouvelle fonction
  getOrdonnancesByConsultationId, // <-- NOUVEAU: Importer la fonction pour récupérer les ordonnances
  deleteOrdonnance, // <-- NOUVEAU: Importer la fonction de suppression d'ordonnance
} = require("../controllers/consultationController"); // Assurez-vous que ces fonctions sont exportées
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");

const router = express.Router();

// 1. Route pour créer une nouvelle consultation
router.post("/", authMiddleware, checkRole(["vet", "admin"]), createConsultation);

// 2. Route pour obtenir TOUTES les consultations
router.get("/all", authMiddleware, checkRole(["vet", "admin"]), getAllConsultations);

// 3. Route pour obtenir les consultations par ID d'animal
router.get("/pet/:petId", authMiddleware, checkRole(["pet-owner", "vet", "admin"]), getConsultationsByPet);

// 4. Route pour obtenir une seule consultation par son ID
router.get("/:id", authMiddleware, checkRole(["pet-owner", "vet", "admin"]), getConsultationById);

// 5. Route pour mettre à jour une consultation existante par son ID
router.put("/:id", authMiddleware, checkRole(["vet", "admin"]), updateConsultation);


// --- NOUVELLES ROUTES POUR LES ORDONNANCES ---

// 6. NOUVEAU: Route pour ajouter une ordonnance à une consultation spécifique
router.post("/:consultationId/ordonnances", authMiddleware, checkRole(["vet", "admin"]), addOrdonnanceToConsultation);

// 7. NOUVEAU: Route pour obtenir toutes les ordonnances d'une consultation spécifique
router.get("/:consultationId/ordonnances", authMiddleware, checkRole(["pet-owner", "vet", "admin"]), getOrdonnancesByConsultationId);

// 8. NOUVEAU: Route pour supprimer une ordonnance par son ID (Ordonnances en tant que ressource séparée)
// Note: Le frontend appelle DELETE /api/ordonnances/:ordonnanceId, donc cette route ne va pas dans /consultations
// Il est préférable de la placer dans un fichier de routes séparé (par exemple ordonnanceRoutes.js)
// ou de modifier l'URL du frontend pour correspondre à /api/consultations/:consultationId/ordonnances/:id
// Pour l'instant, je vais la mettre ici, mais la meilleure pratique serait une route d'ordonnance dédiée
router.delete("/ordonnances/:id", authMiddleware, checkRole(["vet", "admin"]), deleteOrdonnance);


module.exports = router;