// backend/controllers/consultationController.js
const Consultation = require("../models/ConsultationModel");
const Ordonnance = require("../models/OrdonnanceModel"); // Assurez-vous d'avoir créé ce fichier modèle

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

  try {
    const consultations = await Consultation.find({ petId })
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

    if (!consultations || consultations.length === 0) {
      return res.status(404).json({
        message: "Aucune consultation trouvée pour cet animal.",
      });
    }

    // Contrôle d'accès avancé : Le propriétaire doit posséder l'animal
    if (userRole === "pet-owner") {
      const isOwner = consultations.some(
        (consult) =>
          consult.petId && String(consult.petId.ownerId) === userId
      );
      if (!isOwner) {
        return res
          .status(403)
          .json({ message: "Accès refusé. Vous n'êtes pas le propriétaire de cet animal." });
      }
    } else if (userRole === "vet") {
        // Un vétérinaire peut voir toutes les consultations d'un animal s'il est l'un des vétérinaires ayant traité cet animal
        // ou si vous permettez à tous les vétérinaires de voir toutes les consultations des animaux.
        // Pour une sécurité plus stricte, on pourrait vérifier si le vétérinaire est associé à cette consultation.
    } else if (userRole === "admin") {
        // Les admins ont accès à tout
    } else {
        return res.status(403).json({ message: "Accès refusé." });
    }

    res.json(consultations);
  } catch (error) {
    console.error(`Erreur getConsultationsByPet ${petId}:`, error.message);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID d'animal invalide." });
    }
    res.status(500).json({ message: "Erreur serveur" });
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
    } else if (userRole === "vet" && consultation.vetId && String(consultation.vetId._id) === userId) { // CORRIGÉ: Ajout de ._id
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

    // CORRIGÉ: Ajout de ._id
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
 * Ajouter une ordonnance à une consultation existante
 */
exports.addOrdonnanceToConsultation = async (req, res) => {
  const { consultationId } = req.params;
  const { medicaments, notesSpeciales } = req.body;
  const vetId = req.user.id;

  if (!medicaments || medicaments.length === 0 || !consultationId) {
    return res.status(400).json({
      message: "Les médicaments et l'ID de consultation sont obligatoires pour créer une ordonnance.",
    });
  }

  try {
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({ message: "Consultation non trouvée." });
    }

    // CORRIGÉ: Ajout de ._id
    if (req.user.role === "vet" && String(consultation.vetId._id) !== vetId) {
        return res.status(403).json({ message: "Non autorisé à ajouter une ordonnance à cette consultation (vous n'êtes pas le vétérinaire assigné)." });
    }
    if (!["vet", "admin"].includes(req.user.role)) {
        return res.status(403).json({ message: "Seuls les vétérinaires et les administrateurs peuvent ajouter des ordonnances." });
    }

    const nouvelleOrdonnance = new Ordonnance({
      consultationId,
      vetId,
      medicaments,
      notesSpeciales,
    });

    const savedOrdonnance = await nouvelleOrdonnance.save();

    res.status(201).json({
      message: "Ordonnance ajoutée avec succès !",
      ordonnance: savedOrdonnance,
    });
  } catch (err) {
    console.error("Erreur ajout ordonnance à consultation (détails) :", err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(el => el.message);
      return res.status(400).json({
        message: "Erreur de validation lors de l'enregistrement de l'ordonnance.",
        errors: errors,
      });
    }
    if (err.name === "CastError") {
      return res.status(400).json({ message: "ID de consultation ou de vétérinaire invalide." });
    }
    res.status(500).json({
      message: "Échec de l'enregistrement de l'ordonnance.",
      error: err.message,
    });
  }
};

/**
 * Obtenir les ordonnances pour une consultation spécifique
 */
exports.getOrdonnancesByConsultationId = async (req, res) => {
  const { consultationId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const consultation = await Consultation.findById(consultationId)
      .populate("petId", "ownerId")
      .populate("vetId"); // Assurez-vous que vetId est peuplé pour le contrôle d'accès

    if (!consultation) {
      return res.status(404).json({ message: "Consultation non trouvée." });
    }

    // Contrôles d'accès
    // Ici, consultation.vetId._id est déjà correct
    if (userRole === "admin") {
    } else if (userRole === "vet" && consultation.vetId && String(consultation.vetId._id) === userId) {
    } else if (userRole === "pet-owner" && consultation.petId && String(consultation.petId.ownerId) === userId) {
    } else {
        return res.status(403).json({ message: "Accès refusé. Vous n'êtes pas autorisé à voir les ordonnances de cette consultation." });
    }

    const ordonnances = await Ordonnance.find({ consultationId })
      .populate("vetId", "username email")
      .sort({ dateEmission: -1 });

    res.json(ordonnances);
  } catch (err) {
    console.error(`Erreur getOrdonnancesByConsultationId ${consultationId}:`, err.message);
    if (err.name === "CastError") {
      return res.status(400).json({ message: "ID de consultation invalide." });
    }
    res.status(500).json({ message: "Erreur serveur lors du chargement des ordonnances." });
  }
};


/**
 * Supprimer une ordonnance
 */
exports.deleteOrdonnance = async (req, res) => {
  const { id } = req.params;

  try {
    const ordonnance = await Ordonnance.findById(id).populate('consultationId');

    if (!ordonnance) {
      return res.status(404).json({ message: "Ordonnance non trouvée." });
    }

    // Contrôle d'accès : Seul l'administrateur ou le vétérinaire qui a créé l'ordonnance
    // ou le vétérinaire de la consultation parente peut la supprimer.
    if (req.user.role === "admin") {
      // Admin peut supprimer
    } else if (req.user.role === "vet") {
        // Le vétérinaire qui a émis l'ordonnance (ordonnance.vetId n'est pas populé, donc pas besoin de ._id)
        if (String(ordonnance.vetId) === req.user.id) {
            // OK
        }
        // OU le vétérinaire assigné à la consultation parente (consultationId est populé, son vetId doit être vérifié avec ._id)
        else if (ordonnance.consultationId && ordonnance.consultationId.vetId && String(ordonnance.consultationId.vetId._id) === req.user.id) { // CORRIGÉ: Ajout de ._id
            // OK
        } else {
            return res.status(403).json({ message: "Non autorisé à supprimer cette ordonnance." });
        }
    } else {
      return res.status(403).json({ message: "Accès refusé. Seuls les vétérinaires et les administrateurs peuvent supprimer des ordonnances." });
    }

    await Ordonnance.findByIdAndDelete(id);
    res.status(200).json({ message: "Ordonnance supprimée avec succès." });

  } catch (err) {
    console.error(`Erreur suppression ordonnance ${id}:`, err.message);
    if (err.name === "CastError") {
      return res.status(400).json({ message: "ID d'ordonnance invalide." });
    }
    res.status(500).json({ message: "Erreur serveur lors de la suppression de l'ordonnance." });
  }
};