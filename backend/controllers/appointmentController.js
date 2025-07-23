// backend/controllers/appointmentController.js
const Appointment = require("../models/appointmentModel");
const User = require("../models/userModel"); // Ajouté: Nécessaire pour peupler ownerId et vetId
const Pet = require("../models/petModel");   // Ajouté: Nécessaire pour peupler petId

// ✅ Créer un rendez-vous
exports.createAppointment = async (req, res) => {
  try {
    const { petId, vetId, date, reason } = req.body;
    const ownerId = req.user.id; // L'ID du propriétaire vient de l'utilisateur authentifié

    // Validation basique
    if (!petId || !vetId || !date || !reason) {
        return res.status(400).json({ message: "Tous les champs (animal, vétérinaire, date, raison) sont obligatoires." });
    }

    const appointment = await Appointment.create({
      petId,
      vetId,
      ownerId,
      date,
      reason,
      status: "en attente", // Nouveau rendez-vous est toujours en attente
    });

    // Repeupler les champs pour répondre directement avec des données complètes
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("petId", "name species") // Ajout de 'species' pour plus de détails
      .populate("ownerId", "username role _id")
      .populate("vetId", "username _id");

    res.status(201).json({ message: "Rendez-vous créé avec succès", appointment: populatedAppointment });
  } catch (error) {
    console.error("Erreur lors de la création du rendez-vous:", error);
    res.status(500).json({ message: "Erreur serveur lors de la création du rendez-vous", error: error.message });
  }
};

// ✅ Récupérer tous les rendez-vous (principalement pour les administrateurs)
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("petId", "name species")
      .populate("ownerId", "username role _id")
      .populate("vetId", "username _id");

    res.json(appointments);
  } catch (error) {
    console.error("Erreur lors de la récupération de tous les rendez-vous:", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des rendez-vous", error: error.message });
  }
};

// NOUVEAU: ✅ Obtenir les rendez-vous d'un propriétaire spécifique
exports.getAppointmentsByOwner = async (req, res) => {
  try {
    const ownerId = req.user.id; // L'ID du propriétaire vient du token JWT
    const appointments = await Appointment.find({ ownerId })
      .populate("petId", "name species")
      .populate("ownerId", "username role _id")
      .populate("vetId", "username _id");
    res.status(200).json(appointments);
  } catch (error) {
      console.error("Erreur lors de la récupération des rendez-vous du propriétaire :", error);
      res.status(500).json({ message: "Erreur serveur lors de la récupération des rendez-vous du propriétaire.", error: error.message });
  }
};

// NOUVEAU: ✅ Obtenir les rendez-vous d'un vétérinaire spécifique
exports.getAppointmentsByVet = async (req, res) => {
  try {
    const vetId = req.user.id; // L'ID du vétérinaire vient du token JWT
    const appointments = await Appointment.find({ vetId })
      .populate("petId", "name species")
      .populate("ownerId", "username role _id")
      .populate("vetId", "username _id");
    res.status(200).json(appointments);
  } catch (error) {
      console.error("Erreur lors de la récupération des rendez-vous du vétérinaire :", error);
      res.status(500).json({ message: "Erreur serveur lors de la récupération des rendez-vous du vétérinaire.", error: error.message });
  }
};

// ✅ Mettre à jour le statut d'un rendez-vous
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { status } = req.body;
    const userId = req.user.id;

    const validStatuses = ["en attente", "confirmé", "annulé", "terminé"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Statut invalide fourni." });
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate("vetId", "_id"); // On a juste besoin de l'ID du vétérinaire pour la vérification

    if (!appointment) {
      return res.status(404).json({ message: "Rendez-vous non trouvé." });
    }

    // Vérification d'autorisation pour changer le statut
    // Seul le vétérinaire assigné (ou un admin) peut changer le statut
    if (req.user.role === "vet" && appointment.vetId && appointment.vetId._id.toString() === userId.toString()) {
        // Le vétérinaire assigné peut modifier le statut
    } else if (req.user.role === "admin") {
        // L'admin peut modifier le statut
    } else {
      return res.status(403).json({
        message: "Accès refusé : vous n'êtes pas autorisé à modifier le statut de ce rendez-vous.",
      });
    }

    appointment.status = status;
    await appointment.save();

    // Repeupler pour la réponse
    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate("petId", "name species")
      .populate("ownerId", "username role _id")
      .populate("vetId", "username _id");

    res.json({ message: "Statut du rendez-vous mis à jour avec succès", appointment: updatedAppointment });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut du rendez-vous:", error);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour du statut du rendez-vous", error: error.message });
  }
};

// ✅ Récupérer un rendez-vous par son ID
exports.getAppointmentById = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const userId = req.user.id; // L'utilisateur qui fait la requête
    const userRole = req.user.role;

    const appointment = await Appointment.findById(appointmentId)
      .populate("petId", "name species")
      .populate("ownerId", "username role _id")
      .populate("vetId", "username _id");

    if (!appointment) {
      return res.status(404).json({ message: "Rendez-vous non trouvé." });
    }

    // Vérification d'autorisation pour voir un rendez-vous spécifique
    // Seul le propriétaire de l'animal, le vétérinaire assigné ou un admin peut voir
    const isOwner = appointment.ownerId && appointment.ownerId._id.toString() === userId.toString();
    const isAssignedVet = appointment.vetId && appointment.vetId._id.toString() === userId.toString();
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAssignedVet && !isAdmin) {
      return res.status(403).json({ message: "Accès refusé. Vous n'êtes pas autorisé à voir ce rendez-vous." });
    }

    res.status(200).json(appointment);
  } catch (error) {
    console.error("Erreur lors de la récupération du rendez-vous par ID:", error);
    if (error.name === 'CastError') { // Gère les IDs mal formés
        return res.status(400).json({ message: "ID de rendez-vous invalide." });
    }
    res.status(500).json({ message: "Erreur serveur lors de la récupération du rendez-vous par ID.", error: error.message });
  }
};

// ✅ Supprimer (ou annuler) un rendez-vous
exports.deleteAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Rendez-vous non trouvé." });
    }

    // Vérification d'autorisation pour l'annulation
    // Seul le propriétaire du rendez-vous ou un admin peut l'annuler.
    // Un vétérinaire peut aussi l'annuler via updateAppointmentStatus, mais ici c'est pour le client.
    const isOwner = appointment.ownerId.toString() === userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Accès refusé. Vous n'êtes pas autorisé à annuler ce rendez-vous." });
    }

    // Changer le statut à 'annulé' au lieu de supprimer physiquement
    // C'est généralement préféré pour garder un historique
    appointment.status = 'annulé';
    await appointment.save();

    res.status(200).json({ message: "Rendez-vous annulé avec succès.", appointment });
  } catch (error) {
    console.error("Erreur serveur lors de l'annulation du rendez-vous:", error);
    if (error.name === 'CastError') {
        return res.status(400).json({ message: "ID de rendez-vous invalide." });
    }
    res.status(500).json({ message: "Erreur serveur lors de l'annulation du rendez-vous.", error: error.message });
  }
};

// ✅ Mettre à jour un rendez-vous (pour le propriétaire, avant confirmation)
exports.updateAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { date, reason, petId, vetId } = req.body; // Champs que le client peut modifier

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Rendez-vous non trouvé." });
    }

    // Vérification d'autorisation: Seul le propriétaire du rendez-vous peut le modifier
    // Et seulement si le statut est 'en attente'
    if (appointment.ownerId.toString() !== userId || appointment.status !== 'en attente') {
      // Un admin pourrait aussi modifier, mais pour un client, c'est limité
      if (userRole !== 'admin') {
        return res.status(403).json({ message: "Accès refusé. Vous n'êtes pas autorisé à modifier ce rendez-vous ou son statut ne permet plus la modification." });
      }
    }

    // Mettre à jour les champs
    appointment.date = date || appointment.date;
    appointment.reason = reason || appointment.reason;
    appointment.petId = petId || appointment.petId; // Permettre au client de changer d'animal
    appointment.vetId = vetId || appointment.vetId; // Permettre au client de changer de vétérinaire
    // Ne pas changer le statut ici, c'est géré par updateAppointmentStatus

    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate("petId", "name species")
      .populate("ownerId", "username role _id")
      .populate("vetId", "username _id");

    res.json({ message: "Rendez-vous mis à jour avec succès", appointment: updatedAppointment });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du rendez-vous:", error);
    if (error.name === 'CastError') {
        return res.status(400).json({ message: "ID de rendez-vous invalide." });
    }
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour du rendez-vous.", error: error.message });
  }
};

// ✅ Compter les rendez-vous par utilisateur (propriétaire ou vétérinaire)
exports.countAppointmentsByUser = async (req, res) => {
  try {
    const userId = req.user.id; // L'ID de l'utilisateur (propriétaire ou vétérinaire) vient du token JWT
    const userRole = req.user.role; // Le rôle de l'utilisateur vient du token JWT

    let query = {};

    // Déterminer la requête en fonction du rôle de l'utilisateur
    if (userRole === 'pet-owner') {
      query = { ownerId: userId };
    } else if (userRole === 'vet') {
      query = { vetId: userId };
    } else {
      // Pour les administrateurs ou autres rôles, on pourrait vouloir compter tous les rendez-vous
      // Ou renvoyer 0 si ce rôle n'est pas censé avoir des rendez-vous spécifiques
      return res.status(403).json({ message: "Accès refusé. Ce rôle n'est pas autorisé à compter les rendez-vous de cette manière." });
    }

    const count = await Appointment.countDocuments(query);
    res.status(200).json({ count });
  } catch (error) {
    console.error("Erreur lors du comptage des rendez-vous par utilisateur :", error);
    res.status(500).json({ message: "Erreur serveur lors du comptage des rendez-vous.", error: error.message });
  }
};