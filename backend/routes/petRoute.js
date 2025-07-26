const express = require("express");
const {
  addPet,
  updatePet,
  deletePet,
  getPetsByOwner,
  getAllPets,
  getPetById,
  getPetCountByOwner,
  getTotalPetCount // <-- Updated: Import the new handler for total pet count
} = require("../controllers/petController");
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload"); // Assurez-vous d'avoir ce middleware pour la gestion des fichiers

const router = express.Router();

// Routes pour les propriétaires d'animaux (Pet Owners)

/**
 * @route POST /api/pets/
 * @desc Ajouter un nouvel animal
 * @access Private (Owner Only)
 */
router.post("/ajoutPet", authMiddleware, checkRole(["pet-owner"]), upload.single("image"), addPet);

/**
 * @route PUT /api/pets/:id
 * @desc Mettre à jour un animal existant par ID
 * @access Private (Owner Only)
 */
router.put("/:id", authMiddleware, checkRole(["pet-owner"]), upload.single("image"), updatePet);

/**
 * @route DELETE /api/pets/:id
 * @desc Supprimer un animal par ID
 * @access Private (Owner Only)
 */
router.delete("/:id", authMiddleware, checkRole(["pet-owner"]), deletePet);

/**
 * @route GET /api/pets/mine
 * @desc Lister les animaux du propriétaire connecté
 * @access Private (Owner Only)
 */
router.get("/mine", authMiddleware, checkRole(["pet-owner"]), getPetsByOwner);

/**
 * @route GET /api/pets/mine/count
 * @desc Obtenir le nombre d'animaux pour le propriétaire connecté
 * @access Private (Owner Only)
 */
router.get("/mine/count", authMiddleware, checkRole(["pet-owner"]), getPetCountByOwner); // Route for owner's pet count


// Routes pour les administrateurs et vétérinaires (Admins & Vets)

/**
 * @route GET /api/pets/all
 * @desc Lister tous les animaux (pour Admin/Vet)
 * @access Private (Admin, Vet)
 */
router.get("/all", authMiddleware, checkRole(["admin", "vet"]), getAllPets);

/**
 * @route GET /api/pets/:id
 * @desc Récupérer un animal par son ID (accessible par Propriétaire, Admin, Vet)
 * @access Private (Owner, Admin, Vet)
 */
router.get("/:id", authMiddleware, checkRole(["pet-owner", "vet", "admin"]), getPetById);

/**
 * @route GET /api/pets/total/count
 * @desc Obtenir le nombre total d'animaux dans le système (pour Admin/Vet dashboard)
 * @access Private (Admin, Vet)
 */
// Now directly use the new handler from the controller
router.get("/total/count", authMiddleware, checkRole(["admin", "vet"]), getTotalPetCount);


module.exports = router;