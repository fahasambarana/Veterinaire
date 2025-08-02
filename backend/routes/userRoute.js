const express = require("express");
const router = express.Router();
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");
const { getAllClients, countClients, getAllVets , updateProfilePicture, deleteUser} = require("../controllers/userController");
const User = require("../models/userModel");
const upload = require("../middleware/upload"); // Assurez-vous d'importer votre middleware d'upload

router.get("/clients", authMiddleware, checkRole(["admin", "vet"]), getAllClients);
router.get("/vets", authMiddleware, checkRole(["admin", "pet-owner", "vet"]), getAllVets);
router.get("/countClients", authMiddleware, countClients);

// NOUVELLE ROUTE : Mise à jour de la photo de profil
// @route   PUT /api/users/profile/picture
// @desc    Mettre à jour la photo de profil de l'utilisateur
// @access  Private (tous les rôles)
router.put(
  "/profile/picture",
  authMiddleware,
  upload.single("profilePicture"), // 'profilePicture' doit correspondre au nom du champ dans votre FormData du frontend
  updateProfilePicture
);

// NOUVELLE ROUTE : Lister les utilisateurs éligibles pour démarrer un chat
router.get('/chat-eligible', authMiddleware, checkRole(['pet-owner', 'vet', 'admin']), async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;
    const searchTerm = req.query.search || '';

    let query = { _id: { $ne: currentUserId } };

    if (currentUserRole === 'pet-owner') {
      query.role = 'vet';
    } else if (currentUserRole === 'vet') {
      query.role = 'pet-owner';
    } else if (currentUserRole === 'admin') {
      query.role = { $in: ['pet-owner', 'vet'] };
    } else {
      return res.status(200).json([]);
    }

    if (searchTerm) {
      query.username = { $regex: searchTerm, $options: 'i' };
    }

    const users = await User.find(query).select('username role').lean();
    res.json(users);
  } catch (error) {
    console.error("Erreur backend /api/users/chat-eligible:", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des utilisateurs éligibles." });
  }
});

// ✅ NOUVELLE ROUTE : Suppression d'un utilisateur par son ID
// @route   DELETE /api/users/:id
// @desc    Supprimer un utilisateur par ID
// @access  Private (Admin uniquement)
router.delete('/:id', authMiddleware, checkRole(['admin']), deleteUser);

module.exports = router;
