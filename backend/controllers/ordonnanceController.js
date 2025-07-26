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
    // Ensure deep population for the response of createOrdonnance as well
    const populatedOrdonnance = await Ordonnance.findById(newOrdonnance._id)
      .populate('vetId', 'username')
      .populate({
        path: 'consultationId',
        // Select all fields from consultation, including petId, so it can be populated further
        select: 'date diagnosis treatment notes weight temperature symptoms petId vetId',
        populate: [ // Nested populate for petId and then ownerId
          {
            path: 'petId',
            select: 'name species ownerId',
            populate: {
              path: 'ownerId',
              select: 'username'
            }
          },
          {
            path: 'vetId', // Also populate vetId within consultationId if needed for consultation details
            select: 'username'
          }
        ]
      });

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

  console.log("--- Débogage Ordonnance (getOrdonnancesByConsultation) ---");
  console.log("Utilisateur connecté - ID:", userId, "Rôle:", userRole);
  console.log("Consultation ID demandée:", consultationId);

  if (!consultationId) {
    return res.status(400).json({ message: "ID de consultation manquant." });
  }

  try {
    const consultation = await Consultation.findById(consultationId)
      .populate({
        path: 'petId',
        select: 'name species ownerId', // Select ownerId to populate it further
        populate: {
          path: 'ownerId',
          select: 'username' // Select username from ownerId
        }
      })
      .populate("vetId", "_id");
    if (!consultation) {
      return res.status(404).json({ message: "Consultation non trouvée." });
    }

    // Logique d'autorisation avancée
    // 1. Si l'utilisateur est le vétérinaire de la consultation
    if (userRole === 'vet' && String(consultation.vetId._id) === userId) {
      // Autorisé
    }
    // 2. Si l'utilisateur est le propriétaire de l'animal associé à la consultation
    else if (userRole === 'pet-owner' && consultation.petId && consultation.petId.ownerId && String(consultation.petId.ownerId._id) === userId) {
      // Autorisé
    }
    // 3. Si l'utilisateur est admin
    else if (userRole === 'admin') {
      // Autorisé
    }
    // 4. Sinon, accès refusé
    else {
      console.log("Échec de l'autorisation :", { userRole, vetId: String(consultation.vetId._id), ownerId: consultation.petId?.ownerId ? String(consultation.petId.ownerId._id) : 'N/A', userId });
      return res.status(403).json({ message: "Accès refusé. Rôle non autorisé ou vous n'êtes pas le vétérinaire/propriétaire de cette consultation." });
    }

    // FIX CRUCIAL: Assurez-vous que 'consultationId' est entièrement populé,
    // et que 'petId' est populé à l'intérieur de 'consultationId',
    // puis 'ownerId' est populé à l'intérieur de 'petId'.
    const ordonnances = await Ordonnance.find({ consultationId })
      .populate("vetId", "username") // Pour afficher le nom du vétérinaire qui a émis l'ordonnance
      .populate({
        path: 'consultationId', // Populer le champ consultationId de l'ordonnance
        // IMPORTANT: Sélectionnez TOUS les champs nécessaires de la consultation, y compris 'petId'
        // pour que la population imbriquée de 'petId' fonctionne correctement.
        select: 'date diagnosis treatment notes weight temperature symptoms petId vetId',
        populate: [ // Population imbriquée pour petId et ensuite ownerId
          {
            path: 'petId',
            select: 'name species ownerId', // Sélectionnez les champs nécessaires de l'animal, y compris 'ownerId'
            populate: {
              path: 'ownerId',
              select: 'username' // Sélectionnez le nom d'utilisateur du propriétaire
            }
          },
          {
            path: 'vetId', // Popule également vetId à l'intérieur de consultationId si nécessaire
            select: 'username'
          }
        ]
      })
      .sort({ dateEmission: -1 });

    // --- DEBUGGING LOGS FOR POPULATED DATA ---
    console.log("Ordonnances récupérées avec population:");
    ordonnances.forEach(ordonnance => {
        console.log(`  Ordonnance ID: ${ordonnance._id}`);
        console.log(`  Vétérinaire (ordonnance): ${ordonnance.vetId?.username}`);
        if (ordonnance.consultationId) {
            console.log(`  Consultation ID (populé): ${ordonnance.consultationId._id}`);
            if (ordonnance.consultationId.petId) {
                console.log(`    Animal Nom: ${ordonnance.consultationId.petId.name}`);
                console.log(`    Animal Espèce: ${ordonnance.consultationId.petId.species}`);
                if (ordonnance.consultationId.petId.ownerId) {
                    console.log(`      Propriétaire Nom: ${ordonnance.consultationId.petId.ownerId.username}`);
                } else {
                    console.log(`      Propriétaire ID non populé ou manquant dans petId.`);
                }
            } else {
                console.log(`    Pet ID non populé ou manquant dans consultationId.`);
            }
        } else {
            console.log(`  Consultation ID non populé ou manquant dans ordonnance.`);
        }
    });
    // --- END DEBUGGING LOGS ---

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
      .populate('vetId', 'username') // Populate vetId directly on the Ordonnance
      .populate({
        path: 'consultationId', // Populate the consultation document itself
        // Crucial: Select all necessary fields from Consultation, including petId
        select: 'date diagnosis treatment notes weight temperature symptoms petId vetId',
        populate: [ // Nested populate for petId and then ownerId
          {
            path: 'petId',
            select: 'name species ownerId',
            populate: {
              path: 'ownerId',
              select: 'username'
            }
          },
          {
            path: 'vetId', // Also populate vetId within consultationId if needed for consultation details
            select: 'username'
          }
        ]
      });

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

// ✅ Récupérer une ordonnance par son ID
exports.getOrdonnanceById = async (req, res) => {
  try {
    const { id } = req.params;

    const ordonnance = await Ordonnance.findById(id)
      .populate('vetId', 'username') // Populate vetId directly on the Ordonnance
      .populate({
        path: 'consultationId', // Populate the consultation document itself
        // Crucial: Select all necessary fields from Consultation, including petId
        select: 'date diagnosis treatment notes weight temperature symptoms petId vetId',
        populate: [ // Nested populate for petId and then ownerId
          {
            path: 'petId',
            select: 'name species ownerId',
            populate: {
              path: 'ownerId',
              select: 'username'
            }
          },
          {
            path: 'vetId', // Also populate vetId within consultationId if needed for consultation details
            select: 'username'
          }
        ]
      });

    if (!ordonnance) {
      return res.status(404).json({ message: "Ordonnance non trouvée." });
    }

    res.status(200).json(ordonnance);
  } catch (error) {
    console.error("Erreur getOrdonnanceById:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
