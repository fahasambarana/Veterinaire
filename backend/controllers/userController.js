// controllers/userController.js
const User = require("../models/userModel");

exports.getAllClients = async (req, res) => {
  try {
    // Tu peux adapter selon "Client", "client", etc.
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
  // Obtenir tous les vétérinaires
exports.getAllVets = async (req, res) => {
  try {
    const vets = await User.find({ role: "vet" }).select("username email _id");
    res.status(200).json(vets); // ← doit renvoyer un tableau
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

