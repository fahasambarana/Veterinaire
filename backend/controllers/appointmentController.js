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
    });

    res.status(201).json({ message: "Rendez-vous créé", appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Liste des RDV (admin/vet)
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("petId", "name")
      .populate("ownerId", "username")
      .populate("vetId", "username");

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
