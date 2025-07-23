// src/components/ClientAppointmentScheduler.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid"; // Importé pour permettre les vues par heure
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

Modal.setAppElement("#root");

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ClientAppointmentScheduler = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [vets, setVets] = useState([]);
  const [selectedVetId, setSelectedVetId] = useState("");
  const [vetDisponibilities, setVetDisponibilities] = useState([]);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null); // Contient les infos du créneau de disponibilité cliqué (début et fin du créneau)
  const [appointmentReason, setAppointmentReason] = useState("");
  const [error, setError] = useState(null);
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [appointmentDateTime, setAppointmentDateTime] = useState(""); // Date/heure que le client choisit pour le RDV

  useEffect(() => {
    const fetchVets = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/users/vets`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setVets(res.data);
        if (res.data.length > 0) {
          setSelectedVetId(res.data[0]._id); // Sélectionne le premier vétérinaire par défaut
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des vétérinaires:", err);
        setError("Impossible de charger la liste des vétérinaires.");
      }
    };
    fetchVets();
  }, []);

  useEffect(() => {
    const fetchPets = async () => {
      if (!loading && user && user.role === 'pet-owner') {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`${API_URL}/pets/mine`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setPets(res.data);
          if (res.data.length > 0) {
            setSelectedPetId(res.data[0]._id);
          }
        } catch (err) {
          console.error("Erreur lors de la récupération des animaux:", err);
          setError("Impossible de charger la liste de vos animaux.");
        }
      }
    };
    if (!loading) {
      fetchPets();
    }
  }, [loading, user]);

  useEffect(() => {
    const fetchVetDisponibilities = async () => {
      if (!selectedVetId) {
        setVetDisponibilities([]);
        return;
      }
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/disponibilites/${selectedVetId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const formattedDisponibilities = res.data
          .filter(d => d.type === "Disponible" && new Date(d.date_fin) > new Date())
          .map((d) => ({
            id: d._id,
            title: "Disponible",
            start: d.date_debut,
            end: d.date_fin,
            color: "green",
            extendedProps: {
              disponibiliteId: d._id,
              vetId: d.vetId,
              type: d.type
            },
          }));
        setVetDisponibilities(formattedDisponibilities);
        setError(null);
      } catch (err) {
        console.error("Erreur lors du chargement des disponibilités:", err);
        setError("Impossible de charger les disponibilités du vétérinaire.");
        setVetDisponibilities([]);
      }
    };
    fetchVetDisponibilities();
  }, [selectedVetId]);

  /**
   * Gère le clic sur un créneau de disponibilité "Disponible".
   * Ouvre la modale pour prendre rendez-vous et pré-remplit la date/heure.
   */
  const handleSlotClick = (arg) => {
    // S'assurer que le créneau est bien "Disponible" et non déjà passé
    if (arg.event.extendedProps.type !== "Disponible" || new Date(arg.event.end) < new Date()) { // Utilise la date de fin pour être sûr que le créneau est encore valide
      setError("Ce créneau n'est pas disponible ou est passé.");
      return;
    }

    // Stocke les informations du créneau de disponibilité cliqué
    setSelectedSlot({
      disponibiliteId: arg.event.extendedProps.disponibiliteId,
      vetId: arg.event.extendedProps.vetId,
      start: arg.event.start.toISOString().slice(0, 16), // Début du créneau disponible
      end: arg.event.end ? arg.event.end.toISOString().slice(0, 16) : null, // Fin du créneau disponible
    });

    // Initialise le champ de l'heure du RDV avec le début du créneau cliqué
    setAppointmentDateTime(arg.event.start.toISOString().slice(0, 16));
    setAppointmentReason("");
    setAppointmentModalOpen(true);
    setError(null);
  };

  /**
   * Gère la soumission du formulaire de prise de rendez-vous.
   */
  const handleSubmitAppointment = async (e) => {
    e.preventDefault();
    setError(null);

    // Vérifications d'autorisation et de données
    if (!user || user.role !== 'pet-owner') {
      setError("Vous devez être connecté en tant que client pour prendre un rendez-vous.");
      return;
    }
    if (!selectedSlot || !appointmentReason || !selectedPetId || !appointmentDateTime) {
      setError("Veuillez remplir tous les champs et sélectionner un créneau.");
      return;
    }

    // Convertit les chaînes de date en objets Date pour la comparaison
    const selectedAppointmentDate = new Date(appointmentDateTime);
    const slotStartDate = new Date(selectedSlot.start);
    const slotEndDate = new Date(selectedSlot.end);

    // *** Nouvelle validation : s'assurer que l'heure choisie est dans le créneau ***
    if (selectedAppointmentDate < slotStartDate || selectedAppointmentDate >= slotEndDate) {
      setError(`L'heure du rendez-vous doit être entre ${new Date(selectedSlot.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} et ${new Date(selectedSlot.end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.`);
      return;
    }
    // Vérifier aussi que l'heure choisie n'est pas déjà passée
    if (selectedAppointmentDate < new Date()) {
      setError("Vous ne pouvez pas prendre de rendez-vous dans le passé.");
      return;
    }


    const token = localStorage.getItem("token");
    if (!token) {
      setError("Vous n'êtes pas authentifié.");
      return;
    }

    const payload = {
      vetId: selectedSlot.vetId,
      ownerId: user.id,
      petId: selectedPetId,
      date: appointmentDateTime, // Utilise la date/heure choisie par le client
      reason: appointmentReason,
      status: "en attente"
    };

    try {
      await axios.post(`${API_URL}/appointments/create`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Rendez-vous demandé avec succès ! Le vétérinaire sera notifié.");
      setAppointmentModalOpen(false);
      // Optionnel: Recharger les disponibilités si le backend marque le créneau comme pris après réservation
      // fetchVetDisponibilities();
    } catch (err) {
      console.error("Erreur lors de la prise de rendez-vous:", err.response?.data || err.message);
      setError(`Échec de la prise de rendez-vous: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-700">
        Chargement des informations utilisateur...
      </div>
    );
  }

  if (!user || user.role !== 'pet-owner') {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md text-center text-red-600">
        Vous n'êtes pas autorisé à accéder à cette page. Seuls les clients peuvent prendre des rendez-vous.
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-teal-700">
        Prendre un rendez-vous
      </h2>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">Erreur :</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Sélecteur de vétérinaire */}
      <div className="mb-4">
        <label htmlFor="vet-select" className="block text-sm font-medium text-gray-700 mb-1">
          Sélectionner un vétérinaire :
        </label>
        <select
          id="vet-select"
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          value={selectedVetId}
          onChange={(e) => setSelectedVetId(e.target.value)}
        >
          {vets.length === 0 && <option value="">Aucun vétérinaire disponible</option>}
          {vets.map((vet) => (
            <option key={vet._id} value={vet._id}>
              {vet.username}
            </option>
          ))}
        </select>
      </div>

      {selectedVetId ? (
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay", // Permet au client de changer de vue
          }}
          buttonText={{
            today: "Aujourd'hui",
            month: "Mois",
            week: "Semaine",
            day: "Jour",
          }}
          events={vetDisponibilities}
          eventClick={handleSlotClick}
          locale="fr"
          height="auto"
          eventDisplay="block"
          validRange={{
            start: new Date(),
          }}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false
          }}
        />
      ) : (
        <div className="text-center py-8 text-gray-600">
          Veuillez sélectionner un vétérinaire pour voir ses disponibilités.
        </div>
      )}

      {/* Modale de prise de rendez-vous */}
      <Modal
        isOpen={appointmentModalOpen}
        onRequestClose={() => {
          setAppointmentModalOpen(false);
          setError(null);
        }}
        contentLabel="Prendre rendez-vous"
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-auto my-auto outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50"
      >
        <h3 className="text-xl font-semibold mb-4 text-teal-700">
          Confirmer le rendez-vous
        </h3>

        {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}

        <form onSubmit={handleSubmitAppointment}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date et heure du rendez-vous :</label>
            <input
              type="datetime-local"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              value={appointmentDateTime}
              onChange={(e) => setAppointmentDateTime(e.target.value)} // <-- Rendu modifiable
              required
            />
            {selectedSlot && (
                <p className="text-sm text-gray-500 mt-1">
                    Créneau sélectionné: Du {new Date(selectedSlot.start).toLocaleDateString('fr-FR')} à {new Date(selectedSlot.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    {' '}au {new Date(selectedSlot.end).toLocaleDateString('fr-FR')} à {new Date(selectedSlot.end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="pet-select-modal" className="block text-sm font-medium text-gray-700 mb-1">Animal :</label>
            <select
              id="pet-select-modal"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              value={selectedPetId}
              onChange={(e) => setSelectedPetId(e.target.value)}
              required
            >
              <option value="">Choisir un animal</option>
              {pets.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="reason-textarea" className="block text-sm font-medium text-gray-700 mb-1">Motif du rendez-vous :</label>
            <textarea
              id="reason-textarea"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              value={appointmentReason}
              onChange={(e) => setAppointmentReason(e.target.value)}
              rows="3"
              placeholder="Ex: Vaccin annuel, Consultation générale, etc."
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out"
            >
              Confirmer le rendez-vous
            </button>
            <button
              type="button"
              onClick={() => {
                setAppointmentModalOpen(false);
                setError(null);
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out"
            >
              Annuler
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClientAppointmentScheduler;