// backend/routes/petRoute.js
const express = require("express");
const router = express.Router();
const petController = require("../controllers/petController");
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload"); // import de multer

// Ajouter un animal avec upload d'image
router.post(
  "/ajoutPet",
  authMiddleware,
  upload.single("image"), // 'image' est le nom du champ de fichier dans le FormData du frontend
  petController.addPet
);

// Modifier un animal avec image (optionnel)
router.put(
  "/:id", // Chemin RESTful pour la modification
  authMiddleware,
  upload.single("image"),
  petController.updatePet
);

// Lister les animaux du propriétaire connecté (PLUS SPÉCIFIQUE, DOIT VENIR AVANT /:id)
router.get("/mine", authMiddleware, petController.getPetsByOwner);

router.get('/mine/count', authMiddleware, checkRole(["pet-owner", "admin", "vet"]), petController.getPetCountByOwner);

// IMPORTANT : Lister tous les animaux (admin ou vet uniquement) - DOIT VENIR AVANT /:id
router.get(
  "/all",
  authMiddleware,
  checkRole(["admin", "vet"]), // S'assure que seul admin/vet peut accéder
  petController.getAllPets
);

// Récupérer un animal par son ID (PLUS GÉNÉRALE, DOIT VENIR APRÈS /all et /mine)
router.get("/:id", authMiddleware, petController.getPetById);


// Supprimer un animal (propriétaire connecté)
router.delete(
  "/:id", // Chemin RESTful pour la suppression
  authMiddleware,
  petController.deletePet
);

module.exports = router;