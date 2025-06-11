const Appointment = require("../models/appointmentModel");

// Créer un rendez-vous
exports.createAppointment = async (req, res) => {
  try {
    const { petId, vetId, date, reason } = req.body;
    const ownerId = req.user.id;

    const appointment = await Appointment.create({
      petId,
      vetId,
      ownerId,
      date,
      reason,
      status: "en attente",
    });

    res.status(201).json({ message: "Rendez-vous créé", appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer tous les rendez-vous (pour admin et vétérinaires)
exports.getAllAppointments = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;

    let appointments;

    if (role === "admin") {
      // Admin peut voir tous les rendez-vous
      appointments = await Appointment.find()
        .populate("petId", "name")
        .populate("ownerId", "username")
        .populate("vetId", "username");
    } else if (role === "vet") {
      // Le vétérinaire voit seulement ses rendez-vous
      appointments = await Appointment.find()
        .populate("petId", "name")
        .populate("ownerId", "username")
        .populate("vetId", "username");
    } else if (role === "client") {
      // Le client voit ses propres rendez-vous
      appointments = await Appointment.find({ ownerId: userId })
        .populate("petId", "name")
        .populate("ownerId", "username")
        .populate("vetId", "username");
    } else {
      return res.status(403).json({ message: "Rôle non autorisé" });
    }

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour le statut d'un rendez-vous (vétérinaire uniquement)
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { status } = req.body;

    // Seul le vétérinaire peut modifier le statut
    if (req.user.role !== "vet") {
      return res.status(403).json({
        message: "Accès refusé : seuls les vétérinaires peuvent modifier le statut",
      });
    }

    const validStatuses = ["en attente", "confirmé", "annulé", "terminé"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Rendez-vous non trouvé" });
    }

    // Vérifie si ce rendez-vous appartient bien au véto connecté
    if (appointment.vetId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        message: "Ce rendez-vous ne vous est pas assigné",
      });
    }

    appointment.status = status;
    await appointment.save();

    res.json({ message: "Statut mis à jour avec succès", appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
