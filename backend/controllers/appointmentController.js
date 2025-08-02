// backend/controllers/appointmentController.js

const Appointment = require("../models/appointmentModel");
const User = require("../models/userModel");
const Pet = require("../models/petModel");
const mongoose = require('mongoose');

// Importation de la fonction utilitaire de notification
const { createAndEmitNotification } = require("./notificationController");

// Fonction d'aide pour formater les dates de manière lisible
const formatDate = (date) => {
  if (date instanceof Date && !isNaN(date)) {
    // Utiliser toLocaleDateString pour un format lisible
    return date.toLocaleDateString();
  }
  return "une date inconnue";
};

// @desc    Créer un nouveau rendez-vous
// @route   POST /api/appointments/create
// @access  Privé (pet-owner)
exports.createAppointment = async (req, res) => {
  try {
    const { petId, vetId, date, reason } = req.body;
    const ownerId = req.user.id;

    // Validation initiale de la requête
    if (!petId || !vetId || !date || !reason) {
      return res.status(400).json({ message: "Tous les champs (animal, vétérinaire, date, raison) sont requis." });
    }

    // Validation des IDs
    if (!mongoose.Types.ObjectId.isValid(petId) || !mongoose.Types.ObjectId.isValid(vetId)) {
        return res.status(400).json({ message: "Un ou plusieurs des IDs fournis ne sont pas valides." });
    }

    // Création du rendez-vous dans la base de données
    const appointment = await Appointment.create({
      petId,
      vetId,
      ownerId,
      date,
      reason,
      status: "en attente",
    });

    // Peupler les données pour la réponse et la notification
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("petId", "name species")
      .populate("ownerId", "username role _id")
      .populate("vetId", "username _id");

    const io = req.app.get('io');
    if (io && typeof createAndEmitNotification === 'function') {
      // Créer et émettre la notification au vétérinaire
      await createAndEmitNotification({
        recipientId: vetId,
        title: "Nouveau rendez-vous en attente",
        message: `Un nouveau rendez-vous a été créé par ${req.user.username} pour le ${formatDate(new Date(date))}.`,
        type: "appointment_created",
        entityId: appointment._id,
      }, io);
    } else {
        console.error("Erreur: L'instance Socket.IO n'est pas disponible ou la fonction de notification est manquante.");
    }

    res.status(201).json({ message: "Rendez-vous créé avec succès", appointment: populatedAppointment });
  } catch (error) {
    console.error("Erreur lors de la création du rendez-vous:", error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({ message: `Erreur de format pour le champ ${error.path}: ${error.value}.` });
    }

    res.status(500).json({ message: "Erreur interne du serveur lors de la création du rendez-vous.", error: error.message });
  }
};

// @desc    Récupérer tous les rendez-vous (principalement pour les admins)
// @route   GET /api/appointments/all
// @access  Privé (admin, vet)
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

// @desc    Récupérer les rendez-vous d'un propriétaire spécifique
// @route   GET /api/appointments/mine
// @access  Privé (pet-owner)
exports.getAppointmentsByOwner = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const appointments = await Appointment.find({ ownerId })
      .populate("petId", "name species")
      .populate("ownerId", "username role _id")
      .populate("vetId", "username _id");
    res.status(200).json(appointments);
  } catch (error) {
    console.error("Erreur lors de la récupération des rendez-vous du propriétaire:", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des rendez-vous du propriétaire.", error: error.message });
  }
};

// @desc    Récupérer les rendez-vous d'un vétérinaire spécifique
// @route   GET /api/appointments/mine
// @access  Privé (vet)
exports.getAppointmentsByVet = async (req, res) => {
  try {
    const vetId = req.user.id;
    const appointments = await Appointment.find({ vetId })
      .populate("petId", "name species")
      .populate("ownerId", "username role _id")
      .populate("vetId", "username _id");
    res.status(200).json(appointments);
  } catch (error) {
    console.error("Erreur lors de la récupération des rendez-vous du vétérinaire:", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des rendez-vous du vétérinaire.", error: error.message });
  }
};

// @desc    Mettre à jour le statut d'un rendez-vous
// @route   PUT /api/appointments/:id/status
// @access  Privé (vet, admin)
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { status } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ message: "ID de rendez-vous invalide." });
    }

    const validStatuses = ["en attente", "confirmé", "annulé", "rejeté", "terminé"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Statut invalide fourni." });
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate("vetId", "_id")
      .populate("petId", "name")
      .populate("ownerId", "_id");

    if (!appointment) {
      return res.status(404).json({ message: "Rendez-vous non trouvé." });
    }

    const isAssignedVet = appointment.vetId && appointment.vetId._id.toString() === userId.toString();
    const isAdmin = req.user.role === "admin";
    
    if (isAssignedVet || isAdmin) {
      const oldStatus = appointment.status;
      appointment.status = status;
      await appointment.save();
  
      const io = req.app.get('io');
      if (io && appointment.ownerId && typeof createAndEmitNotification === 'function') {
        let notificationTitle;
        let notificationMessage;
        let notificationType;
  
        // Gérer les notifications pour chaque changement de statut
        if (status === 'confirmé' && oldStatus !== 'confirmé') {
          notificationTitle = 'Rendez-vous confirmé';
          notificationMessage = `Votre rendez-vous pour ${appointment.petId.name} le ${formatDate(appointment.date)} a été confirmé.`;
          notificationType = 'appointment_approved';
        } else if (status === 'annulé' && oldStatus !== 'annulé') {
          notificationTitle = 'Rendez-vous annulé';
          notificationMessage = `Votre rendez-vous pour ${appointment.petId.name} le ${formatDate(appointment.date)} a été annulé par le vétérinaire.`;
          notificationType = 'appointment_cancelled';
        } else if (status === 'rejeté' && oldStatus !== 'rejeté') {
          notificationTitle = 'Rendez-vous rejeté';
          notificationMessage = `Votre demande de rendez-vous pour ${appointment.petId.name} le ${formatDate(appointment.date)} a été rejetée.`;
          notificationType = 'appointment_rejected';
        } else if (status === 'terminé' && oldStatus !== 'terminé') {
          notificationTitle = 'Rendez-vous terminé';
          notificationMessage = `Le rendez-vous pour ${appointment.petId.name} le ${formatDate(appointment.date)} est terminé.`;
          notificationType = 'appointment_completed';
        }
  
        if (notificationType) {
          // Emettre la notification au propriétaire de l'animal
          await createAndEmitNotification({
            recipientId: appointment.ownerId._id,
            title: notificationTitle,
            message: notificationMessage,
            type: notificationType,
            entityId: appointment._id,
          }, io);
        }
      } else {
        console.error("Erreur: L'instance Socket.IO n'est pas disponible ou la fonction de notification est manquante.");
      }
  
      const updatedAppointment = await Appointment.findById(appointmentId)
        .populate("petId", "name species")
        .populate("ownerId", "username role _id")
        .populate("vetId", "username _id");
  
      return res.json({ message: "Statut du rendez-vous mis à jour avec succès", appointment: updatedAppointment });
    } else {
      return res.status(403).json({
        message: "Accès refusé: vous n'êtes pas autorisé à modifier le statut de ce rendez-vous.",
      });
    }

  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut du rendez-vous:", error);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour du statut du rendez-vous", error: error.message });
  }
};

// @desc    Récupérer un rendez-vous par son ID
// @route   GET /api/appointments/:id
// @access  Privé (owner, admin, vet)
exports.getAppointmentById = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Peupler les données de l'animal, du propriétaire et du vétérinaire
    const appointment = await Appointment.findById(appointmentId)
      .populate("petId", "name species")
      .populate("ownerId", "username role _id")
      .populate("vetId", "username _id");

    if (!appointment) {
      return res.status(404).json({ message: "Rendez-vous non trouvé." });
    }

    const isOwner = appointment.ownerId && appointment.ownerId._id.toString() === userId.toString();
    const isAssignedVet = appointment.vetId && appointment.vetId._id.toString() === userId.toString();
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAssignedVet && !isAdmin) {
      return res.status(403).json({ message: "Accès refusé. Vous n'êtes pas autorisé à voir ce rendez-vous." });
    }

    res.status(200).json(appointment);
  } catch (error) {
    console.error("Erreur lors de la récupération du rendez-vous par ID:", error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "ID de rendez-vous invalide." });
    }
    res.status(500).json({ message: "Erreur serveur lors de la récupération du rendez-vous par ID.", error: error.message });
  }
};

// @desc    Annuler un rendez-vous (par l'owner ou l'admin)
// @route   PUT /api/appointments/:id/cancel
// @access  Privé (owner, admin)
exports.cancelAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ message: "ID de rendez-vous invalide." });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Rendez-vous non trouvé." });
    }

    const isOwner = appointment.ownerId.toString() === userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Accès refusé. Vous n'êtes pas autorisé à annuler ce rendez-vous." });
    }

    if (appointment.status === 'annulé') {
      return res.status(200).json({ message: "Le rendez-vous est déjà annulé.", appointment });
    }

    appointment.status = 'annulé';
    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate("petId", "name")
      .populate("vetId", "_id")
      .populate("ownerId", "_id"); // Ajout du peuplement pour le propriétaire
      
    const io = req.app.get('io');
    if (io && typeof createAndEmitNotification === 'function') {
      // Notifier le vétérinaire si c'est le propriétaire qui annule
      if (isOwner) {
        await createAndEmitNotification({
          recipientId: updatedAppointment.vetId._id,
          title: "Rendez-vous annulé",
          message: `Le rendez-vous pour ${updatedAppointment.petId.name} le ${formatDate(updatedAppointment.date)} a été annulé par le propriétaire.`,
          type: "appointment_cancelled",
          entityId: updatedAppointment._id,
        }, io);
      }

      // Notifier le propriétaire si c'est un admin qui annule
      if (isAdmin) {
        await createAndEmitNotification({
          recipientId: updatedAppointment.ownerId._id, // Correction de l'ID du destinataire
          title: "Rendez-vous annulé par l'administration",
          message: `Votre rendez-vous pour ${updatedAppointment.petId.name} le ${formatDate(updatedAppointment.date)} a été annulé par l'administration.`,
          type: "appointment_cancelled",
          entityId: updatedAppointment._id,
        }, io);
      }
    } else {
        console.error("Erreur: L'instance Socket.IO n'est pas disponible ou la fonction de notification est manquante.");
    }
    
    res.status(200).json({ message: "Rendez-vous annulé avec succès.", appointment: updatedAppointment });
  } catch (error) {
    console.error("Erreur serveur lors de l'annulation du rendez-vous:", error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "ID de rendez-vous invalide." });
    }
    res.status(500).json({ message: "Erreur serveur lors de l'annulation du rendez-vous.", error: error.message });
  }
};

// @desc    Compter les rendez-vous par utilisateur (propriétaire ou vétérinaire)
// @route   GET /api/appointments/count/me
// @access  Privé (pet-owner, vet)
exports.countAppointmentsByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = {};

    if (userRole === 'pet-owner') {
      query = { ownerId: userId };
    } else if (userRole === 'vet') {
      query = { vetId: userId };
    } else {
      return res.status(403).json({ message: "Accès refusé. Ce rôle n'est pas autorisé à compter les rendez-vous de cette manière." });
    }

    const count = await Appointment.countDocuments(query);
    res.status(200).json({ count });
  } catch (error) {
    console.error("Erreur lors du comptage des rendez-vous par utilisateur:", error);
    res.status(500).json({ message: "Erreur serveur lors du comptage des rendez-vous.", error: error.message });
  }
};
