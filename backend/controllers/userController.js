// backend/controllers/userController.js
const User = require("../models/userModel"); // Assurez-vous que cette ligne est au début du fichier
const Pet = require("../models/petModel"); // Si Pet n'est pas déjà importé et nécessaire ici

exports.getAllClients = async (req, res) => {
  try {
    const clients = await User.find({ role: "pet-owner" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.countClients = async (req, res) => {
    try {
      const total = await User.countDocuments({ role: "pet-owner" });
      res.status(200).json({ totalClients: total });
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
  };

exports.getAllVets = async (req, res) => {
  try {
    const vets = await User.find({ role: "vet" }).select("username email _id");
    res.status(200).json(vets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPetsByOwner = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const pets = await Pet.find({ ownerId });
    res.json(pets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Nouvelle fonction pour la mise à jour de la photo de profil
exports.updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id; // ID de l'utilisateur authentifié

    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier image n\'a été fourni.' });
    }

    // Le chemin où l'image est accessible (doit correspondre à votre configuration Multer et Express.static)
    const profilePicturePath = `/uploads/profiles/${req.file.filename}`;

    // 🚨 CORRECTION ICI : Récupérer l'utilisateur AVANT de tenter de modifier ses propriétés
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Mettre à jour la propriété de l'utilisateur avec le nouveau chemin
    user.profilePicture = profilePicturePath;

    // Sauvegarder les modifications dans la base de données
    await user.save();

    // Renvoyer les données utilisateur mises à jour (sans le mot de passe)
    const updatedUser = await User.findById(userId).select('-password');
    res.status(200).json({
      message: 'Photo de profil mise à jour avec succès.',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la photo de profil:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de la photo de profil.' });
  }
};