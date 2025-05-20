const express = require("express");
const router = express.Router();
const petController = require("../controllers/petController");
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");

// Ajouter un animal (propriétaire connecté)
router.post("/ajoutPet", authMiddleware, petController.addPet);

// Modifier un animal (propriétaire connecté)
router.put("/update/:id", authMiddleware, petController.updatePet);

// Supprimer un animal (propriétaire connecté)
router.delete("/delete/:id", authMiddleware, petController.deletePet);

// Lister les animaux du propriétaire connecté
router.get("/mine", authMiddleware, petController.getPetsByOwner);

// Lister tous les animaux avec info propriétaires (accessible uniquement admin ou vet)
router.get(
  "/all",
  authMiddleware,
  checkRole(["admin", "vet"]),
  petController.getAllPets
);

module.exports = router;
