// backend/controllers/consultationController.js

const Consultation = require('../models/ConsultationModel');
const Appointment = require('../models/appointmentModel');
const Pet = require('../models/petModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');
const { createAndEmitNotification } = require("./notificationController");

// @desc    Créer une nouvelle consultation
// @route   POST /api/consultations/
// @access  Privé (vet, admin)
const createConsultation = async (req, res) => {
  const {
    petId,
    vetId,
    appointmentId,
    date,
    reason,
    weight,
    temperature,
    symptoms,
    diagnosis,
    treatment,
    notes
  } = req.body;

  try {
    // Validation des identifiants mongoose
    if (!mongoose.Types.ObjectId.isValid(petId) ||
      !mongoose.Types.ObjectId.isValid(vetId) ||
      !mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ message: "Un ou plusieurs des IDs fournis ne sont pas valides." });
    }
    
    // Vérifier l'existence de l'animal et de son propriétaire
    // Nous récupérons ici l'ownerId directement du modèle Pet
    const pet = await Pet.findById(petId).populate('ownerId');
    if (!pet || !pet.ownerId) {
      return res.status(404).json({ message: "L'animal ou son propriétaire n'a pas été trouvé." });
    }
    const ownerId = pet.ownerId._id;

    // Vérifier que le vétérinaire existe
    const vet = await User.findById(vetId);
    if (!vet) {
      return res.status(404).json({ message: "Le vétérinaire n'a pas été trouvé." });
    }

    // Validation des champs essentiels
    if (!petId || !vetId || !ownerId || !appointmentId || !date || !symptoms || !diagnosis) {
      return res.status(400).json({ message: "Les informations essentielles (petId, vetId, ownerId, appointmentId, date, symptômes, diagnostic) sont requises." });
    }

    // Création de la nouvelle consultation
    const newConsultation = new Consultation({
      petId,
      vetId,
      ownerId, // Utiliser l'ownerId récupéré du document Pet
      appointmentId,
      date,
      reason,
      weight,
      temperature,
      symptoms,
      diagnosis,
      treatment,
      notes,
    });

    const savedConsultation = await newConsultation.save();
    
    // Mettre à jour le statut du rendez-vous à "terminé"
    const updatedAppointment = await Appointment.findByIdAndUpdate(
        appointmentId, 
        { status: 'terminé' },
        { new: true }
    );
    if (!updatedAppointment) {
        console.warn(`Avertissement: Impossible de trouver et de mettre à jour le rendez-vous avec l'ID ${appointmentId}.`);
    }

    // Envoi de la notification au propriétaire de l'animal
    const io = req.app.get('io');
    if (io) {
      const populatedConsultation = await Consultation.findById(savedConsultation._id)
          .populate('petId', 'name')
          .populate('vetId', 'username');

      createAndEmitNotification({
          recipientId: ownerId,
          message: `La consultation pour votre animal ${populatedConsultation.petId.name} a été enregistrée par le vétérinaire ${populatedConsultation.vetId.username}.`,
          type: "consultation_completed",
          entityId: savedConsultation._id,
      }, io);
    }
    
    res.status(201).json(savedConsultation);

  } catch (error) {
    console.error("Erreur lors de la création de la consultation:", error);
    // Gérer les erreurs de validation spécifiques de Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: "Erreur de validation: " + messages.join(', ') });
    }
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// @desc    Obtenir toutes les consultations
// @route   GET /api/consultations/all
// @access  Privé (vet, admin)
const getAllConsultations = async (req, res) => {
    try {
        const consultations = await Consultation.find({})
            .populate('vetId', 'username')
            .populate('petId', 'name')
            .populate('appointmentId', 'date')
            .sort({ date: -1 });

        res.status(200).json(consultations);
    } catch (error) {
        console.error("Erreur lors de la récupération de toutes les consultations:", error);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
};

// @desc    Obtenir les consultations par ID d'animal
// @route   GET /api/consultations/pet/:petId
// @access  Privé (pet-owner, vet, admin)
const getConsultationsByPet = async (req, res) => {
    try {
        const { petId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(petId)) {
            return res.status(400).json({ message: "ID d'animal invalide." });
        }

        const pet = await Pet.findById(petId).populate('ownerId', 'username');
        if (!pet) {
            return res.status(404).json({ message: "Animal non trouvé." });
        }

        // Vérification de l'accès pour les propriétaires d'animaux
        if (req.user.role === 'pet-owner') {
            if (!pet.ownerId || pet.ownerId._id.toString() !== req.user.id.toString()) {
                return res.status(403).json({ message: "Accès interdit : vous n'êtes pas le propriétaire de cet animal." });
            }
        }

        const consultations = await Consultation.find({ petId })
            .populate('vetId', 'username')
            .populate('petId', 'name')
            .populate('appointmentId', 'date')
            .sort({ date: -1 });

        res.status(200).json(consultations);
    } catch (error) {
        console.error("Erreur lors de la récupération des consultations de l'animal:", error);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
};

// @desc    Obtenir une seule consultation par son ID
// @route   GET /api/consultations/:id
// @access  Privé (pet-owner, vet, admin)
const getConsultationById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID de consultation invalide." });
        }

        const consultation = await Consultation.findById(id)
            .populate('petId', 'name ownerId')
            .populate('vetId', 'username')
            .populate('appointmentId', 'date');

        if (!consultation) {
            return res.status(404).json({ message: "Consultation non trouvée." });
        }

        // Vérification de l'autorisation pour les propriétaires d'animaux
        // S'assurer que le propriétaire de l'animal existe
        if (req.user.role === 'pet-owner' && consultation.petId.ownerId && consultation.petId.ownerId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: "Accès interdit : vous n'êtes pas le propriétaire de l'animal de cette consultation." });
        }

        res.status(200).json(consultation);

    } catch (error) {
        console.error("Erreur lors de la récupération de la consultation:", error);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
};

// @desc    Mettre à jour une consultation
// @route   PUT /api/consultations/:id
// @access  Privé (vet, admin)
const updateConsultation = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID de consultation invalide." });
        }

        const updatedConsultation = await Consultation.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

        if (!updatedConsultation) {
            return res.status(404).json({ message: "Consultation non trouvée." });
        }

        res.status(200).json(updatedConsultation);

    } catch (error) {
        console.error("Erreur lors de la mise à jour de la consultation:", error);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
};

// @desc    Compter le nombre total de consultations
// @route   GET /api/consultations/count
// @access  Privé (vet, admin)
const countConsultations = async (req, res) => {
    try {
        const count = await Consultation.countDocuments();
        res.status(200).json({ count });
    } catch (error) {
        console.error("Erreur lors du comptage des consultations:", error);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
};

module.exports = {
  createConsultation,
  getConsultationsByPet,
  getAllConsultations,
  getConsultationById,
  updateConsultation,
  countConsultations,
};
