const Pet = require("../models/petModel.js");

// Ajouter un animal (sécurisé)
exports.addPet = async (req, res) => {
  try {
    const { name, species, age, gender, image } = req.body;
    const ownerId = req.user.id;

    const newPet = new Pet({ name, species, age, gender, image, ownerId });
    await newPet.save();

    res.status(201).json({ message: "Animal ajouté avec succès", pet: newPet });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Modifier un animal
exports.updatePet = async (req, res) => {
  try {
    const petId = req.params.id;
    const ownerId = req.user.id;

    const pet = await Pet.findOne({ _id: petId, ownerId });

    if (!pet) {
      return res.status(404).json({ message: "Animal non trouvé ou accès refusé" });
    }

    const { name, species, age, gender, image } = req.body;

    pet.name = name || pet.name;
    pet.species = species || pet.species;
    pet.age = age || pet.age;
    pet.gender = gender || pet.gender;
    pet.image = image || pet.image;

    await pet.save();

    res.json({ message: "Animal mis à jour", pet });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Supprimer un animal
exports.deletePet = async (req, res) => {
  try {
    const petId = req.params.id;
    const ownerId = req.user.id;

    const pet = await Pet.findOneAndDelete({ _id: petId, ownerId });

    if (!pet) {
      return res.status(404).json({ message: "Animal non trouvé ou accès refusé" });
    }

    res.json({ message: "Animal supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Lister les animaux du propriétaire connecté
exports.getPetsByOwner = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const pets = await Pet.find({ ownerId });

    res.json(pets);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
// Lister tous les animaux (admin ou vétérinaire)
exports.getAllPets = async (req, res) => {
  try {
    const pets = await Pet.find().populate("ownerId", "username email");
    res.status(200).json(pets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

