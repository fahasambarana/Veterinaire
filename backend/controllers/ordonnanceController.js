// backend/controllers/ordonnanceController.js

const Ordonnance = require("../models/OrdonnanceModel");
const Consultation = require("../models/ConsultationModel"); // Assurez-vous d'importer le modèle Consultation

// ✅ Créer une nouvelle ordonnance pour une consultation spécifique
exports.createOrdonnance = async (req, res) => {
  // consultationId doit venir des paramètres de l'URL si la route est RESTful
  const { consultationId } = req.params;
  const { medicaments, notesSpeciales } = req.body;
  const vetId = req.user.id; // L'ID du vétérinaire/admin qui crée l'ordonnance

  // Validation
  if (!consultationId || !medicaments || medicaments.length === 0) {
    return res
      .status(400)
      .json({
        message:
          "La consultation et au moins un médicament sont obligatoires pour créer une ordonnance.",
      });
  }

  try {
    // Vérifier l'existence de la consultation
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({ message: "Consultation non trouvée." });
    }

    // Contrôle d'accès : Seul le vétérinaire de la consultation ou un admin peut créer une ordonnance
    // Ou si c'est une ordonnance pour une consultation existante, seul le vétérinaire associé ou un admin
    if (req.user.role === 'vet' && String(consultation.vetId) !== vetId) {
        return res.status(403).json({ message: "Non autorisé à créer une ordonnance pour cette consultation. Vous n'êtes pas le vétérinaire associé." });
    }
    if (req.user.role !== 'admin' && req.user.role !== 'vet') {
        return res.status(403).json({ message: "Accès refusé. Seuls les administrateurs et vétérinaires peuvent ajouter des ordonnances." });
    }


    const newOrdonnance = new Ordonnance({
      consultationId,
      vetId, // Assignez l'ID du vétérinaire authentifié
      medicaments,
      notesSpeciales,
      dateEmission: new Date(), // Date d'émission de l'ordonnance
    });

    await newOrdonnance.save();

    // Renvoyer l'ordonnance complète avec les populations si nécessaire
    const populatedOrdonnance = await Ordonnance.findById(newOrdonnance._id)
      .populate('consultationId', 'date diagnosis petId')
      .populate('vetId', 'username');

    res.status(201).json({
      message: "Ordonnance créée avec succès.",
      ordonnance: populatedOrdonnance,
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'ordonnance:", error);
    if (error.name === 'CastError') {
        return res.status(400).json({ message: "ID de consultation invalide." });
    }
    res
      .status(500)
      .json({
        message: "Erreur serveur lors de la création de l'ordonnance",
        error: error.message,
      });
  }
};

// ✅ Récupérer toutes les ordonnances pour une consultation donnée
exports.getOrdonnancesByConsultation = async (req, res) => {
  const { consultationId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  console.log("--- Débogage Ordonnance ---");
  console.log("Utilisateur connecté - ID:", userId, "Rôle:", userRole);
  console.log("Consultation ID demandée:", consultationId);

  if (!consultationId) {
    return res.status(400).json({ message: "ID de consultation manquant." });
  }

  try {
    const consultation = await Consultation.findById(consultationId)
      .populate("petId", "ownerId") // Peupler l'animal pour accéder à son propriétaire
      .populate("vetId", "_id"); // Peupler le vétérinaire pour vérifier l'accès
    if (!consultation) {
      return res.status(404).json({ message: "Consultation non trouvée." });
    }

    // Logique d'autorisation avancée
    // 1. Si l'utilisateur est le vétérinaire de la consultation
    if (userRole === 'vet' && String(consultation.vetId._id) === userId) {
      // Autorisé
    }
    // 2. Si l'utilisateur est le propriétaire de l'animal associé à la consultation
    else if (userRole === 'pet-owner' && String(consultation.petId.ownerId._id) === userId) {
      // Autorisé
    }
    // 3. Si l'utilisateur est admin
    else if (userRole === 'admin') {
      // Autorisé
    }
    // 4. Sinon, accès refusé
    else {
      console.log("Échec de l'autorisation :", { userRole, vetId: String(consultation.vetId._id), ownerId: String(consultation.petId.ownerId._id), userId });
      return res.status(403).json({ message: "Accès refusé. Rôle non autorisé ou vous n'êtes pas le vétérinaire/propriétaire de cette consultation." });
    }

    const ordonnances = await Ordonnance.find({ consultationId })
      .populate("vetId", "username") // Pour afficher le nom du vétérinaire qui a émis l'ordonnance
      .sort({ dateEmission: -1 });

    res.json(ordonnances);
  } catch (error) {
    console.error(
      `Erreur chargement ordonnances pour consultation ${consultationId}:`,
      error.message
    );
    if (error.name === 'CastError') {
        return res.status(400).json({ message: "ID de consultation invalide." });
    }
    res
      .status(500)
      .json({
        message: "Erreur serveur lors de la récupération des ordonnances.",
        error: error.message,
      });
  }
};

// ✅ Supprimer une ordonnance
exports.deleteOrdonnance = async (req, res) => {
  const { id } = req.params; // ID de l'ordonnance à supprimer
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const ordonnance = await Ordonnance.findById(id).populate('vetId', '_id').populate('consultationId', 'vetId');

    if (!ordonnance) {
      return res.status(404).json({ message: "Ordonnance non trouvée." });
    }

    // Seul le vétérinaire qui a créé l'ordonnance ou un admin peut la supprimer
    if (userRole === 'vet' && String(ordonnance.vetId._id) !== userId) {
      return res.status(403).json({ message: "Accès refusé. Vous n'êtes pas autorisé à supprimer cette ordonnance." });
    }
    if (userRole !== 'admin' && userRole !== 'vet') {
        return res.status(403).json({ message: "Accès refusé. Seuls les administrateurs et vétérinaires peuvent supprimer des ordonnances." });
    }

    await Ordonnance.deleteOne({ _id: id }); // Utiliser deleteOne ou findByIdAndDelete

    res.status(200).json({ message: "Ordonnance supprimée avec succès." });
  } catch (error) {
    console.error(`Erreur suppression ordonnance ${id}:`, error.message);
    if (error.name === 'CastError') {
        return res.status(400).json({ message: "ID d'ordonnance invalide." });
    }
    res
      .status(500)
      .json({
        message: "Erreur serveur lors de la suppression de l'ordonnance.",
        error: error.message,
      });
  }
};

// ✅ Mettre à jour une ordonnance
exports.updateOrdonnance = async (req, res) => {
  const { id } = req.params; // ID de l'ordonnance à mettre à jour
  const { medicaments, notesSpeciales } = req.body;
  const userId = req.user.id; // ID de l'utilisateur authentifié
  const userRole = req.user.role;

  // Validation
  if (!medicaments || medicaments.length === 0) {
    return res.status(400).json({ message: "Au moins un médicament est obligatoire pour mettre à jour une ordonnance." });
  }

  try {
    const ordonnance = await Ordonnance.findById(id).populate('vetId', '_id');

    if (!ordonnance) {
      return res.status(404).json({ message: "Ordonnance non trouvée." });
    }

    // Contrôle d'accès : Seul le vétérinaire qui a créé l'ordonnance ou un admin peut la modifier
    if (userRole === 'vet' && String(ordonnance.vetId._id) !== userId) {
      return res.status(403).json({ message: "Accès refusé. Vous n'êtes pas autorisé à modifier cette ordonnance." });
    }
    if (userRole !== 'admin' && userRole !== 'vet') {
        return res.status(403).json({ message: "Accès refusé. Seuls les administrateurs et vétérinaires peuvent modifier des ordonnances." });
    }

    ordonnance.medicaments = medicaments;
    ordonnance.notesSpeciales = notesSpeciales;
    ordonnance.updatedAt = new Date(); // Mettre à jour la date de modification

    const updatedOrdonnance = await ordonnance.save();

    const populatedOrdonnance = await Ordonnance.findById(updatedOrdonnance._id)
      .populate('consultationId', 'date diagnosis petId')
      .populate('vetId', 'username');

    res.status(200).json({
      message: "Ordonnance mise à jour avec succès.",
      ordonnance: populatedOrdonnance,
    });
  } catch (error) {
    console.error(`Erreur mise à jour ordonnance ${id}:`, error.message);
    if (error.name === 'CastError') {
        return res.status(400).json({ message: "ID d'ordonnance invalide." });
    }
    res
      .status(500)
      .json({
        message: "Erreur serveur lors de la mise à jour de l'ordonnance.",
        error: error.message,
      });
  }
};