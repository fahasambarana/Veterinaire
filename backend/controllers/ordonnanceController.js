// backend/controllers/ordonnanceController.js

const Ordonnance = require("../models/OrdonnanceModel");
const Consultation = require("../models/ConsultationModel");
const mongoose = require('mongoose');

// @desc    Créer une nouvelle ordonnance pour une consultation spécifique
// @route   POST /api/ordonnances/:consultationId
// @access  Privé (vet, admin)
exports.createOrdonnance = async (req, res) => {
  const { consultationId } = req.params;
  const { medicaments, notesSpeciales } = req.body;
  const vetId = req.user.id;

  if (!medicaments || medicaments.length === 0) {
    return res.status(400).json({ message: "La consultation et au moins un médicament sont obligatoires pour créer une ordonnance." });
  }

  if (!mongoose.Types.ObjectId.isValid(consultationId)) {
    return res.status(400).json({ message: "ID de consultation invalide." });
  }

  try {
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({ message: "Consultation non trouvée." });
    }

    if (req.user.role === 'vet' && String(consultation.vetId) !== vetId) {
        return res.status(403).json({ message: "Non autorisé à créer une ordonnance pour cette consultation. Vous n'êtes pas le vétérinaire associé." });
    }
    if (req.user.role !== 'admin' && req.user.role !== 'vet') {
        return res.status(403).json({ message: "Accès refusé. Seuls les administrateurs et vétérinaires peuvent ajouter des ordonnances." });
    }

    const newOrdonnance = new Ordonnance({
      consultationId,
      vetId,
      medicaments,
      notesSpeciales,
      dateEmission: new Date(),
    });

    const savedOrdonnance = await newOrdonnance.save();

    const populatedOrdonnance = await Ordonnance.findById(savedOrdonnance._id)
      .populate('vetId', 'username')
      .populate({
        path: 'consultationId',
        select: 'date diagnosis petId',
        populate: {
          path: 'petId',
          select: 'name species ownerId',
          populate: {
            path: 'ownerId',
            select: 'username'
          }
        }
      });

    res.status(201).json({
      message: "Ordonnance créée avec succès.",
      ordonnance: populatedOrdonnance,
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'ordonnance:", error);
    res.status(500).json({ message: "Erreur serveur lors de la création de l'ordonnance", error: error.message });
  }
};

// @desc    Récupérer les ordonnances par ID de consultation
// @route   GET /api/ordonnances/consultation/:consultationId
// @access  Privé (pet-owner, vet, admin)
exports.getOrdonnancesByConsultation = async (req, res) => {
  const { consultationId } = req.params;
  const { id: userId, role: userRole } = req.user;

  if (!mongoose.Types.ObjectId.isValid(consultationId)) {
    return res.status(400).json({ message: "ID de consultation invalide." });
  }

  try {
    // FIX crucial: peupler la consultation pour les vérifications d'accès
    const consultation = await Consultation.findById(consultationId)
      .populate("vetId", "_id")
      .populate({
        path: 'petId',
        select: 'ownerId',
        populate: {
          path: 'ownerId',
          select: '_id'
        }
      });

    if (!consultation) {
      return res.status(404).json({ message: "Consultation non trouvée." });
    }

    let isAuthorized = false;
    // Vérification pour le vétérinaire de la consultation ou l'admin
    if (userRole === 'vet' && consultation.vetId && String(consultation.vetId._id) === userId) {
      isAuthorized = true;
    } else if (userRole === 'admin') {
      isAuthorized = true;
    }
    // Vérification pour le propriétaire de l'animal
    if (!isAuthorized && userRole === 'pet-owner' && consultation.petId && consultation.petId.ownerId && String(consultation.petId.ownerId._id) === userId) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: "Accès refusé. Vous n'êtes pas autorisé à voir ces ordonnances." });
    }

    // Récupérer les ordonnances avec une population complète pour le frontend
    const ordonnances = await Ordonnance.find({ consultationId })
      .populate("vetId", "username")
      .populate({
        path: 'consultationId',
        select: 'date diagnosis treatment notes weight temperature symptoms petId vetId',
        populate: [
          {
            path: 'petId',
            select: 'name species ownerId',
            populate: {
              path: 'ownerId',
              select: 'username'
            }
          },
          {
            path: 'vetId',
            select: 'username'
          }
        ]
      })
      .sort({ dateEmission: -1 });

    res.json(ordonnances);
  } catch (error) {
    console.error(`Erreur chargement ordonnances pour consultation ${consultationId}:`, error.message);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des ordonnances.", error: error.message });
  }
};

// @desc    Récupérer une ordonnance par son ID
// @route   GET /api/ordonnances/:id
// @access  Privé (pet-owner, vet, admin)
exports.getOrdonnanceById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID d'ordonnance invalide." });
  }

  try {
    const ordonnance = await Ordonnance.findById(id)
      .populate('vetId', 'username')
      .populate({
        path: 'consultationId',
        select: 'date diagnosis treatment notes weight temperature symptoms petId vetId',
        populate: [
          {
            path: 'petId',
            select: 'name species ownerId',
            populate: {
              path: 'ownerId',
              select: 'username'
            }
          },
          {
            path: 'vetId',
            select: 'username'
          }
        ]
      });

    if (!ordonnance) {
      return res.status(404).json({ message: "Ordonnance non trouvée." });
    }

    // La logique d'autorisation sera gérée par une couche middleware
    res.status(200).json(ordonnance);
  } catch (error) {
    console.error("Erreur getOrdonnanceById:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// @desc    Modifier une ordonnance
// @route   PUT /api/ordonnances/:id
// @access  Privé (vet, admin)
exports.updateOrdonnance = async (req, res) => {
  const { id } = req.params;
  const { medicaments, notesSpeciales } = req.body;
  const { id: userId, role: userRole } = req.user;

  if (!medicaments || medicaments.length === 0) {
    return res.status(400).json({ message: "Au moins un médicament est obligatoire pour modifier une ordonnance." });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID d'ordonnance invalide." });
  }

  try {
    const ordonnance = await Ordonnance.findById(id).populate('vetId', '_id');

    if (!ordonnance) {
      return res.status(404).json({ message: "Ordonnance non trouvée." });
    }

    if (userRole === 'vet' && String(ordonnance.vetId._id) !== userId) {
      return res.status(403).json({ message: "Accès refusé. Vous n'êtes pas autorisé à modifier cette ordonnance." });
    }
    if (userRole !== 'admin' && userRole !== 'vet') {
        return res.status(403).json({ message: "Accès refusé. Seuls les administrateurs et vétérinaires peuvent modifier des ordonnances." });
    }

    ordonnance.medicaments = medicaments;
    ordonnance.notesSpeciales = notesSpeciales;
    ordonnance.updatedAt = new Date();

    const updatedOrdonnance = await ordonnance.save();

    const populatedOrdonnance = await Ordonnance.findById(updatedOrdonnance._id)
      .populate('vetId', 'username')
      .populate({
        path: 'consultationId',
        select: 'date diagnosis petId',
        populate: {
          path: 'petId',
          select: 'name species ownerId',
          populate: {
            path: 'ownerId',
            select: 'username'
          }
        }
      });

    res.status(200).json({
      message: "Ordonnance mise à jour avec succès.",
      ordonnance: populatedOrdonnance,
    });
  } catch (error) {
    console.error(`Erreur mise à jour ordonnance ${id}:`, error.message);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour de l'ordonnance.", error: error.message });
  }
};

// @desc    Supprimer une ordonnance
// @route   DELETE /api/ordonnances/:id
// @access  Privé (vet, admin)
exports.deleteOrdonnance = async (req, res) => {
  const { id } = req.params;
  const { id: userId, role: userRole } = req.user;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID d'ordonnance invalide." });
  }

  try {
    const ordonnance = await Ordonnance.findById(id).populate('vetId', '_id');

    if (!ordonnance) {
      return res.status(404).json({ message: "Ordonnance non trouvée." });
    }

    if (userRole === 'vet' && String(ordonnance.vetId._id) !== userId) {
      return res.status(403).json({ message: "Accès refusé. Vous n'êtes pas autorisé à supprimer cette ordonnance." });
    }
    if (userRole !== 'admin' && userRole !== 'vet') {
        return res.status(403).json({ message: "Accès refusé. Seuls les administrateurs et vétérinaires peuvent supprimer des ordonnances." });
    }

    await Ordonnance.deleteOne({ _id: id });

    res.status(200).json({ message: "Ordonnance supprimée avec succès." });
  } catch (error) {
    console.error(`Erreur suppression ordonnance ${id}:`, error.message);
    res.status(500).json({ message: "Erreur serveur lors de la suppression de l'ordonnance.", error: error.message });
  }
};
