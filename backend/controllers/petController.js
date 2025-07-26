// backend/controllers/petController.js
const Pet = require("../models/petModel");
const User = require("../models/userModel"); // Pour vérifier si le propriétaire existe lors de l'ajout/modification

// ✅ Ajouter un animal (avec image uploadée)
exports.addPet = async (req, res) => {
  try {
    const { name, species, age, gender } = req.body;
    const ownerId = req.user.id; // ID du propriétaire vient du token d'authentification

    // Validation des champs obligatoires
    if (!name || !species || !age || !gender) {
      return res.status(400).json({
        message:
          "Tous les champs (nom, espèce, âge, sexe) sont obligatoires pour ajouter un animal.",
      });
    }

    // Optionnel: Vérifier si le propriétaire existe réellement
    const ownerExists = await User.findById(ownerId);
    if (!ownerExists) {
      return res.status(404).json({
        message:
          "Propriétaire introuvable. Veuillez vous connecter avec un compte valide.",
      });
    }

    const image = req.file ? req.file.filename : null; // Récupère le nom du fichier de l'image si uploadée

    const newPet = new Pet({
      name,
      species,
      age,
      gender,
      image,
      ownerId,
    });
    await newPet.save();

    // Repeupler l'animal avec les informations du propriétaire pour la réponse
    const populatedPet = await Pet.findById(newPet._id).populate(
      "ownerId",
      "username email"
    );

    res
      .status(201)
      .json({ message: "Animal ajouté avec succès", pet: populatedPet });
  } catch (error) {
    console.error("Erreur serveur lors de l'ajout de l'animal :", error); // Log l'erreur pour le débogage
    res.status(500).json({
      message: "Erreur serveur lors de l'ajout de l'animal",
      error: error.message,
    });
  }
};

// ✅ Modifier un animal (option image)
exports.updatePet = async (req, res) => {
  try {
    const petId = req.params.id;
    const ownerId = req.user.id; // ID du propriétaire authentifié

    // Trouver l'animal et vérifier qu'il appartient bien à l'utilisateur authentifié
    const pet = await Pet.findOne({ _id: petId, ownerId });
    if (!pet) {
      return res
        .status(404)
        .json({ message: "Animal non trouvé ou accès refusé." });
    }

    const { name, species, age, gender } = req.body;
    // Si un nouveau fichier est uploadé, utiliser son nom. Sinon, conserver l'image existante.
    const image = req.file ? req.file.filename : pet.image;

    // Mise à jour des champs avec les nouvelles valeurs (si fournies)
    pet.name = name !== undefined ? name : pet.name;
    pet.species = species !== undefined ? species : pet.species;
    pet.age = age !== undefined ? age : pet.age;
    pet.gender = gender !== undefined ? gender : pet.gender;
    pet.image = image; // Met à jour l'image même si elle est null (pour supprimer l'image si besoin)

    await pet.save();

    // Repeupler l'animal avec les informations du propriétaire pour la réponse
    const populatedPet = await Pet.findById(pet._id).populate(
      "ownerId",
      "username email"
    );

    res.json({ message: "Animal mis à jour avec succès", pet: populatedPet });
  } catch (error) {
    console.error(
      "Erreur serveur lors de la modification de l'animal :",
      error
    );
    if (error.name === "CastError") {
      // Gère les IDs mal formés
      return res.status(400).json({ message: "ID d'animal invalide." });
    }
    res.status(500).json({
      message: "Erreur serveur lors de la modification de l'animal",
      error: error.message,
    });
  }
};

// ✅ Supprimer un animal
exports.deletePet = async (req, res) => {
  try {
    const petId = req.params.id;
    const ownerId = req.user.id;

    // Trouver et supprimer l'animal, en s'assurant qu'il appartient bien au propriétaire
    const pet = await Pet.findOneAndDelete({ _id: petId, ownerId });
    if (!pet) {
      return res
        .status(404)
        .json({ message: "Animal non trouvé ou accès refusé." });
    }

    res.json({ message: "Animal supprimé avec succès." });
  } catch (error) {
    console.error("Erreur serveur lors de la suppression de l'animal :", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID d'animal invalide." });
    }
    res.status(500).json({
      message: "Erreur serveur lors de la suppression de l'animal",
      error: error.message,
    });
  }
};

// ✅ Lister les animaux du propriétaire connecté
exports.getPetsByOwner = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const pets = await Pet.find({ ownerId }).populate(
      "ownerId",
      "username email"
    ); // Populate pour la cohérence

    res.json(pets);
  } catch (error) {
    console.error(
      "Erreur serveur lors de la récupération des animaux du propriétaire :",
      error
    );
    res.status(500).json({
      message: "Erreur serveur lors de la récupération des animaux",
      error: error.message,
    });
  }
};

// ✅ Lister tous les animaux (admin ou vétérinaire)
exports.getAllPets = async (req, res) => {
  try {
    // Le middleware checkRole devrait déjà s'assurer que seul un admin/vet y accède
    const pets = await Pet.find().populate("ownerId", "username email");
    res.status(200).json(pets);
  } catch (error) {
    console.error(
      "Erreur serveur lors de la récupération de tous les animaux :",
      error
    );
    res.status(500).json({
      message: "Erreur serveur lors de la récupération de tous les animaux",
      error: error.message,
    });
  }
};

// ✅ Récupérer un animal par son ID (pour détails ou modification)
exports.getPetById = async (req, res) => {
  try {
    const petId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const pet = await Pet.findById(petId).populate("ownerId", "username email");

    if (!pet) {
      return res.status(404).json({ message: "Animal non trouvé." });
    }

    // Vérification d'autorisation: Seul le propriétaire, un vétérinaire ou un admin peut voir l'animal
    const isOwner =
      pet.ownerId && pet.ownerId._id.toString() === userId.toString();
    const isVetOrAdmin = userRole === "vet" || userRole === "admin";

    if (!isOwner && !isVetOrAdmin) {
      return res.status(403).json({
        message: "Accès refusé. Vous n'êtes pas autorisé à voir cet animal.",
      });
    }

    res.status(200).json(pet);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'animal par ID:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID d'animal invalide." });
    }
    res.status(500).json({
      message: "Erreur serveur lors de la récupération de l'animal par ID.",
      error: error.message,
    });
  }
};
// Compter les animaux d’un utilisateur (par ownerId)
exports.countPetsByOwner = async (ownerId) => {
  try {
    const count = await Pet.countDocuments({ ownerId: ownerId });
    return count;
  } catch (error) {
    console.error("Erreur lors du comptage des animaux:", error);
    throw error;
  }
};
exports.getTotalPetCount = async (req, res) => {
  try {
    // Le contrôle d'accès (admin/vet) doit être géré par le middleware de route
    const count = await Pet.countDocuments();
    res.status(200).json({ totalPets: count });
  } catch (error) {
    console.error("Erreur serveur lors du comptage total des animaux:", error);
    res.status(500).json({
      message: "Erreur serveur lors du comptage total des animaux",
      error: error.message,
    });
  }
};
// GET /api/pets/mine/count
exports.getPetCountByOwner = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const count = await Pet.countDocuments({ ownerId });
    res.status(200).json({ count });
  } catch (error) {
    console.error(
      "Erreur lors du comptage des animaux par utilisateur:",
      error
    );
    res.status(500).json({
      message: "Erreur serveur lors du comptage des animaux de l'utilisateur",
      error: error.message,
    });
  }
};
