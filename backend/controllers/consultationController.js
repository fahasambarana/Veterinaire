// backend/controllers/consultationController.js
const Consultation = require("../models/ConsultationModel");
// const Ordonnance = require("../models/OrdonnanceModel"); // Plus besoin d'importer ici si la logique est déplacée
const Pet = require("../models/petModel")

/**
 * Créer une nouvelle consultation
 */
exports.createConsultation = async (req, res) => {
  const {
    vetId,
    petId,
    appointmentId,
    weight,
    temperature,
    symptoms,
    diagnosis,
    treatment,
    notes,
  } = req.body;

  // Vérification des champs obligatoires
  if (!vetId || !petId || !appointmentId || !diagnosis?.trim()) {
    return res.status(400).json({
      message:
        "Les champs 'vetId', 'petId', 'appointmentId' et 'diagnosis' sont obligatoires.",
    });
  }

  // Contrôle d’accès
  // vetId vient du req.body et n'est pas encore un objet peuplé ici, donc String(vetId) est correct.
  if (req.user.role === "vet" && String(vetId) !== req.user.id) {
    return res
      .status(403)
      .json({
        message:
          "Non autorisé à créer une consultation pour un autre vétérinaire.",
      });
  }

  if (!["vet", "admin"].includes(req.user.role)) {
    return res
      .status(403)
      .json({
        message:
          "Seuls les vétérinaires et les administrateurs peuvent créer des consultations.",
      });
  }

  try {
    const newConsult = new Consultation({
      vetId,
      petId,
      appointmentId,
      weight: weight !== "" ? parseFloat(weight) : null,
      temperature: temperature !== "" ? parseFloat(temperature) : null,
      symptoms,
      diagnosis,
      treatment,
      notes,
    });

    const savedConsultation = await newConsult.save();
    res.status(201).json(savedConsultation);
  } catch (err) {
    console.error("Erreur création consultation:", err.message);
    res.status(500).json({
      message: "Erreur serveur lors de la création de la consultation.",
      error: err.message,
    });
  }
};

/**
 * Obtenir toutes les consultations (pour les administrateurs ou vétérinaires)
 */
exports.getAllConsultations = async (req, res) => {
  try {
    if (!["vet", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Accès interdit." });
    }

    const consultations = await Consultation.find()
      .populate("vetId", "username email")
      .populate({
        path: "petId",
        select: "name species ownerId",
        populate: {
          path: "ownerId",
          select: "username email",
        },
      })
      .populate("appointmentId", "date reason status")
      .sort({ date: -1 });

    res.json(consultations);
  } catch (error) {
    console.error("Erreur getAllConsultations:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * Obtenir les consultations par ID d'animal (pour les propriétaires d'animaux, vétérinaires, admins)
 */
exports.getConsultationsByPet = async (req, res) => {
  const { petId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  console.log(`[DEBUG - getConsultationsByPet] Requête pour petId: ${petId}`);
  console.log(`[DEBUG - getConsultationsByPet] Utilisateur connecté - ID: ${userId}, Rôle: ${userRole}`);

  try {
    // D'abord, trouver l'animal pour vérifier son propriétaire
    const pet = await Pet.findById(petId);
    if (!pet) {
      console.log(`[DEBUG - getConsultationsByPet] Animal non trouvé pour ID: ${petId}`);
      return res.status(404).json({ message: "Animal non trouvé." });
    }
    console.log(`[DEBUG - getConsultationsByPet] Animal trouvé: ${pet.name}, Propriétaire: ${pet.ownerId}`);


    // Logique de contrôle d'accès
    if (userRole === "pet-owner") {
      // Si l'utilisateur est un propriétaire d'animal, il doit être le propriétaire de cet animal
      if (String(pet.ownerId) !== userId) {
        console.log(`[DEBUG - getConsultationsByPet] Accès refusé: Propriétaire d'animal non autorisé. (pet.ownerId: ${pet.ownerId}, userId: ${userId})`);
        return res.status(403).json({
          message:
            "Vous n'êtes pas autorisé à consulter l'historique de cet animal.",
        });
      }
      console.log(`[DEBUG - getConsultationsByPet] Accès accordé: Propriétaire de l'animal.`);
    } else if (userRole === "vet" || userRole === "admin") {
      // Les vétérinaires et administrateurs ont accès
      console.log(`[DEBUG - getConsultationsByPet] Accès accordé: Vétérinaire ou Admin.`);
    } else {
      // Rôle non autorisé
      console.log(`[DEBUG - getConsultationsByPet] Accès refusé: Rôle non autorisé (${userRole}).`);
      return res.status(403).json({ message: "Non autorisé à accéder à cette ressource." });
    }

    // Si l'accès est accordé, récupérer les consultations
    const consultations = await Consultation.find({ petId })
      .populate("vetId", "username email")
      .populate("petId", "name species breed") // On peuple l'animal ici aussi, même si déjà vérifié, pour les données renvoyées
      .sort({ createdAt: -1 });

    console.log(`[DEBUG - getConsultationsByPet] Consultations trouvées: ${consultations.length}`);
    res.json(consultations);
  } catch (err) {
    console.error(`[DEBUG - getConsultationsByPet] Erreur serveur pour petId ${petId}:`, err); // Log l'objet d'erreur complet
    if (err.name === "CastError") {
      return res.status(400).json({ message: "ID de l'animal invalide." });
    }
    res.status(500).json({ message: "Erreur serveur lors de la récupération des consultations." });
  }
};

/**
 * Obtenir une seule consultation par son ID
 */
exports.getConsultationById = async (req, res) => {
  const { id } = req.params;

  try {
    const consultation = await Consultation.findById(id)
      .populate("vetId", "username email")
      .populate({
        path: "petId",
        select: "name species ownerId",
        populate: {
          path: "ownerId",
          select: "username email",
        },
      })
      .populate("appointmentId", "date reason status");

    if (!consultation) {
      return res.status(404).json({ message: "Consultation non trouvée." });
    }

    // Contrôle d'accès
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === "admin") {
      // Admin a accès à tout
    } else if (userRole === "vet" && consultation.vetId && String(consultation.vetId._id) === userId) {
      // Vétérinaire assigné a accès
    } else if (
      userRole === "pet-owner" &&
      consultation.petId &&
      String(consultation.petId.ownerId) === userId
    ) {
      // Propriétaire de l'animal a accès
    } else {
      return res.status(403).json({ message: "Accès refusé." });
    }

    res.json(consultation);
  } catch (error) {
    console.error(`Erreur getConsultationById ${id}:`, error.message);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID de consultation invalide." });
    }
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * Mettre à jour une consultation existante
 */
exports.updateConsultation = async (req, res) => {
  const { id } = req.params;
  const { weight, temperature, symptoms, diagnosis, treatment, notes } =
    req.body;

  if (!diagnosis || !diagnosis.trim()) {
    return res
      .status(400)
      .json({ message: "Le champ 'diagnosis' est obligatoire." });
  }

  try {
    const consultation = await Consultation.findById(id);

    if (!consultation) {
      return res.status(404).json({ message: "Consultation non trouvée." });
    }

    if (req.user.role === "vet" && String(consultation.vetId._id) !== req.user.id) {
      return res.status(403).json({ message: "Modification non autorisée." });
    }

    if (!["vet", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Accès interdit." });
    }

    consultation.weight = weight !== "" ? parseFloat(weight) : null;
    consultation.temperature =
      temperature !== "" ? parseFloat(temperature) : null;
    consultation.symptoms = symptoms;
    consultation.diagnosis = diagnosis;
    consultation.treatment = treatment;
    consultation.notes = notes;
    // Assurez-vous d'avoir ce champ 'updatedAt' dans votre modèle si vous voulez le mettre à jour automatiquement
    // consultation.updatedAt = Date.now();

    const updatedConsultation = await consultation.save();
    res.json(updatedConsultation);
  } catch (err) {
    console.error(`Erreur updateConsultation ${id}:`, err.message);

    if (err.name === "CastError") {
      return res.status(400).json({ message: "ID de consultation invalide." });
    }
    res.status(500).json({
      message: "Erreur serveur lors de la mise à jour de la consultation.",
    });
  }
};

/**
 * Obtenir le nombre total de consultations
 */
exports.countConsultations = async (req, res) => {
  try {
    // Contrôle d'accès : Seuls les administrateurs et les vétérinaires peuvent accéder à ce comptage total
    if (!["vet", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Accès interdit. Seuls les vétérinaires et les administrateurs peuvent obtenir le nombre total de consultations." });
    }

    const totalConsultations = await Consultation.countDocuments();
    res.json({ totalConsultations });
  } catch (error) {
    console.error("Erreur countConsultations:", error.message);
    res.status(500).json({ message: "Erreur serveur lors du comptage des consultations." });
  }
};

// REMARQUE: Les fonctions de gestion des ordonnances (addOrdonnanceToConsultation,
// getOrdonnancesByConsultationId, deleteOrdonnance) ont été retirées de ce fichier
// pour centraliser leur logique dans ordonnanceController.js.
// Assurez-vous que vos routes pour les ordonnances (`ordonnanceRoutes.js`)
// appellent les fonctions correspondantes dans `ordonnanceController.js`.
