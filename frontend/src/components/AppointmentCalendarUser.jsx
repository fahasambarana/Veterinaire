// src/components/ClientAppointmentScheduler.jsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import socket from "../socket"; // Import Socket.IO client

import {
  Loader2, // For loading indicators
  CheckCircle, // For success messages
  XCircle, // For error messages, or close button
  Info, // For general info/warnings
  User as UserIcon, // For vet selection
  PawPrint, // For pet selection
  CalendarDays, // For date/time input
  MessageSquare, // For reason textarea
} from "lucide-react"; // Import Lucide icons

// Set the app element for accessibility for the modal
Modal.setAppElement("#root");

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Reusable Spinner Component
const Spinner = ({ message = "Chargement..." }) => (
  <div className="flex flex-col items-center justify-center py-8 text-gray-700">
    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
    <p className="mt-2 text-lg font-medium">{message}</p>
  </div>
);

const ClientAppointmentScheduler = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [vets, setVets] = useState([]);
  const [selectedVetId, setSelectedVetId] = useState("");
  const [vetDisponibilities, setVetDisponibilities] = useState([]);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [appointmentReason, setAppointmentReason] = useState("");
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [appointmentDateTime, setAppointmentDateTime] = useState("");

  // Loading states
  const [loadingVets, setLoadingVets] = useState(true);
  const [loadingPets, setLoadingPets] = useState(true);
  const [loadingDisponibilities, setLoadingDisponibilities] = useState(false);
  const [submittingAppointment, setSubmittingAppointment] = useState(false);

  // Message states
  const [message, setMessage] = useState({ type: null, text: null }); // { type: 'success' | 'error', text: '...' }

  // Utility to clear messages after a timeout
  const clearMessage = () => {
    setTimeout(() => setMessage({ type: null, text: null }), 5000);
  };

  // Fetch Vets
  useEffect(() => {
    const fetchVets = async () => {
      setLoadingVets(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/users/vets`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setVets(res.data);
        if (res.data.length > 0) {
          setSelectedVetId(res.data[0]._id);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des vétérinaires:", err);
        setMessage({ type: "error", text: "Impossible de charger la liste des vétérinaires." });
        clearMessage();
      } finally {
        setLoadingVets(false);
      }
    };
    fetchVets();
  }, []);

  // Fetch Pets for the current user (pet-owner)
  useEffect(() => {
    const fetchPets = async () => {
      if (!authLoading && user && user.role === 'pet-owner') {
        setLoadingPets(true);
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
          setMessage({ type: "error", text: "Impossible de charger la liste de vos animaux." });
          clearMessage();
        } finally {
          setLoadingPets(false);
        }
      }
    };
    if (!authLoading) {
      fetchPets();
    }
  }, [authLoading, user]);

  // Fetch Vet Disponibilities (made into a useCallback for reusability)
  const fetchVetDisponibilities = useCallback(async () => {
    if (!selectedVetId) {
      setVetDisponibilities([]);
      setLoadingDisponibilities(false);
      return;
    }
    setLoadingDisponibilities(true);
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
          color: "#059669", // Consistent green color for available slots
          extendedProps: {
            disponibiliteId: d._id,
            vetId: d.vetId,
            type: d.type
          },
        }));
      setVetDisponibilities(formattedDisponibilities);
      setMessage({ type: null, text: null });
    } catch (err) {
      console.error("Erreur lors du chargement des disponibilités:", err);
      setMessage({ type: "error", text: "Impossible de charger les disponibilités du vétérinaire." });
      clearMessage();
      setVetDisponibilities([]);
    } finally {
      setLoadingDisponibilities(false);
    }
  }, [selectedVetId]); // Dependencies for useCallback

  // Effect to fetch disponibilities when selectedVetId changes
  useEffect(() => {
    fetchVetDisponibilities();
  }, [fetchVetDisponibilities]); // Depend on the useCallback version

  // Socket.IO listener for real-time availability updates
  useEffect(() => {
    // Join a room specific to the selected vet's availabilities
    if (selectedVetId) {
      socket.emit("joinAvailabilityRoom", selectedVetId);
    }

    const handleAvailabilityUpdate = (updatedVetId) => {
      // If the update is for the currently selected vet, re-fetch their availabilities
      if (updatedVetId === selectedVetId) {
        fetchVetDisponibilities();
      }
    };

    // Listen for a general availability update event
    socket.on("vetAvailabilityUpdated", handleAvailabilityUpdate);

    // Cleanup function for Socket.IO listeners
    return () => {
      socket.off("vetAvailabilityUpdated", handleAvailabilityUpdate);
      if (selectedVetId) {
        socket.emit("leaveAvailabilityRoom", selectedVetId);
      }
    };
  }, [selectedVetId, fetchVetDisponibilities]); // Re-run if selectedVetId or fetch function changes

  /**
   * Handles click on an "Available" slot.
   * Opens the appointment modal and pre-fills date/time.
   */
  const handleSlotClick = useCallback((arg) => {
    // Ensure the slot is "Disponible" and not in the past
    if (arg.event.extendedProps.type !== "Disponible" || new Date(arg.event.end) < new Date()) {
      setMessage({ type: "error", text: "Ce créneau n'est pas disponible ou est passé." });
      clearMessage();
      return;
    }

    // Store clicked slot information
    setSelectedSlot({
      disponibiliteId: arg.event.extendedProps.disponibiliteId,
      vetId: arg.event.extendedProps.vetId,
      start: arg.event.start.toISOString().slice(0, 16), // Start of available slot
      end: arg.event.end ? arg.event.end.toISOString().slice(0, 16) : null, // End of available slot
    });

    // Initialize appointment time field with the start of the clicked slot
    setAppointmentDateTime(arg.event.start.toISOString().slice(0, 16));
    setAppointmentReason("");
    setAppointmentModalOpen(true);
    setMessage({ type: null, text: null }); // Clear any previous error messages
  }, []);

  /**
   * Handles appointment submission form.
   */
  const handleSubmitAppointment = async (e) => {
    e.preventDefault();
    setMessage({ type: null, text: null }); // Clear previous messages
    setSubmittingAppointment(true);

    // Authorization and data checks
    if (!user || user.role !== 'pet-owner') {
      setMessage({ type: "error", text: "Vous devez être connecté en tant que client pour prendre un rendez-vous." });
      setSubmittingAppointment(false);
      clearMessage();
      return;
    }
    if (!selectedSlot || !appointmentReason || !selectedPetId || !appointmentDateTime) {
      setMessage({ type: "error", text: "Veuillez remplir tous les champs et sélectionner un créneau." });
      setSubmittingAppointment(false);
      clearMessage();
      return;
    }

    // Convert date strings to Date objects for comparison
    const selectedAppointmentDate = new Date(appointmentDateTime);
    const slotStartDate = new Date(selectedSlot.start);
    const slotEndDate = new Date(selectedSlot.end);

    // New validation: ensure chosen time is within the slot
    if (selectedAppointmentDate < slotStartDate || selectedAppointmentDate >= slotEndDate) {
      setMessage({
        type: "error",
        text: `L'heure du rendez-vous doit être entre ${new Date(selectedSlot.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} et ${new Date(selectedSlot.end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.`
      });
      setSubmittingAppointment(false);
      clearMessage();
      return;
    }
    // Also check that the chosen time is not in the past
    if (selectedAppointmentDate < new Date()) {
      setMessage({ type: "error", text: "Vous ne pouvez pas prendre de rendez-vous dans le passé." });
      setSubmittingAppointment(false);
      clearMessage();
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage({ type: "error", text: "Vous n'êtes pas authentifié." });
      setSubmittingAppointment(false);
      clearMessage();
      return;
    }

    const payload = {
      vetId: selectedSlot.vetId,
      ownerId: user.id,
      petId: selectedPetId,
      date: appointmentDateTime, // Use the date/time chosen by the client
      reason: appointmentReason,
      status: "en attente"
    };

    try {
      await axios.post(`${API_URL}/appointments/create`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // ✅ Affiche le message de succès sur la page principale après la fermeture du modal
      setMessage({ type: "success", text: "Rendez-vous demandé avec succès ! Le vétérinaire sera notifié." });
      setAppointmentModalOpen(false);
      fetchVetDisponibilities(); // Re-fetch availabilities to reflect the booked slot

      // ✅ Navigue vers la page des rendez-vous client après un court délai
      setTimeout(() => {
        navigate("/appointments"); // Assuming this is the route for client's appointments
      }, 2000); // Navigate after 2 seconds

    } catch (err) {
      console.error("Erreur lors de la prise de rendez-vous:", err.response?.data || err.message);
      setMessage({ type: "error", text: `Échec de la prise de rendez-vous: ${err.response?.data?.message || err.message}` });
    } finally {
      setSubmittingAppointment(false);
      clearMessage(); // ✅ Nettoie le message après 5 secondes, que la navigation ait eu lieu ou non
    }
  };

  if (authLoading) {
    return <Spinner message="Vérification des autorisations..." />;
  }

  if (!user || user.role !== 'pet-owner') {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md text-center mx-auto mt-8 max-w-lg animate-fade-in-down">
        <h3 className="text-xl font-bold mb-2 flex items-center justify-center">
          <XCircle className="w-6 h-6 mr-2" /> Accès Refusé
        </h3>
        <p>Vous n'êtes pas autorisé à accéder à cette page. Seuls les clients peuvent prendre des rendez-vous.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl w-full max-w-5xl mx-auto animate-fade-in">
      <h2 className="text-3xl font-bold mb-6 text-teal-700 text-center">
        Prendre un rendez-vous
      </h2>

      {message.type && (
        <div
          className={`px-4 py-3 rounded-lg relative mb-4 animate-fade-in-down flex items-center justify-between
            ${message.type === "success" ? "bg-green-100 border border-green-400 text-green-700" : "bg-red-100 border border-red-400 text-red-700"}`}
          role="alert"
        >
          <div className="flex items-center">
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <XCircle className="w-5 h-5 mr-2" />
            )}
            <span className="block sm:inline font-medium">{message.text}</span>
          </div>
          <button
            onClick={() => setMessage({ type: null, text: null })}
            className={`p-1 rounded-full ${message.type === "success" ? "hover:bg-green-200" : "hover:bg-red-200"} transition-colors duration-200`}
            aria-label="Fermer l'alerte"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Vet Selector */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
        <label htmlFor="vet-select" className="block text-lg font-semibold text-gray-800 mb-2 flex items-center">
          <UserIcon className="w-5 h-5 mr-2 text-teal-600" />
          Sélectionner un vétérinaire :
        </label>
        {loadingVets ? (
          <Spinner message="Chargement des vétérinaires..." />
        ) : vets.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucun vétérinaire disponible pour le moment.</p>
        ) : (
          <select
            id="vet-select"
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-700 text-base transition duration-200 ease-in-out hover:border-teal-400"
            value={selectedVetId}
            onChange={(e) => setSelectedVetId(e.target.value)}
          >
            {vets.map((vet) => (
              <option key={vet._id} value={vet._id}>
                {vet.username}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Calendar Display */}
      {selectedVetId ? (
        loadingDisponibilities ? (
          <Spinner message="Chargement des disponibilités..." />
        ) : vetDisponibilities.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-4 rounded-lg relative mb-4 text-center animate-fade-in-down">
            <Info className="w-6 h-6 mx-auto mb-2" />
            <p className="font-medium">Ce vétérinaire n'a pas de disponibilités futures ou elles n'ont pas encore été chargées.</p>
            <p className="text-sm mt-1">Veuillez choisir un autre vétérinaire ou vérifier ultérieurement.</p>
          </div>
        ) : (
          <div className="calendar-container shadow-inner bg-gray-50 p-4 rounded-lg  border border-gray-100">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
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
                start: new Date(), // Only show current and future dates
              }}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false,
                hour12: false
              }}
              dayCellContent={(arg) => { // Custom styling for day cells
                const date = arg.date;
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Normalize today to start of day

                let className = "fc-daygrid-day-frame p-2 rounded-lg transition duration-200 ease-in-out";
                if (date.getTime() === today.getTime()) {
                  className += " bg-teal-100 border-2 border-teal-500 shadow-md"; // Highlight today
                } else if (date < today) {
                  className += " bg-gray-100 text-gray-400 opacity-70 cursor-not-allowed"; // Past dates
                } else {
                  className += " hover:bg-teal-50 hover:shadow-sm"; // Future dates
                }
                return <div className={className}>{arg.dayNumberText}</div>;
              }}
              eventContent={(arg) => ( // Custom event content for better styling
                <div className="flex flex-col px-0.5 py-0.5 text-sm cursor-pointer hover:opacity-80 transition-opacity duration-150 rounded-md">
                  <span className="font-semibold text-white">{arg.event.title}</span>
                  <span className="text-xs text-white opacity-90">
                    {new Date(arg.event.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} -
                    {new Date(arg.event.end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              className="shadow-md rounded-lg" // Apply shadow and rounded corners to the calendar itself
            />
          </div>
        )
      ) : (
        <div className="text-center py-8 text-gray-600 bg-gray-50 p-4 rounded-lg shadow-inner border border-gray-100">
          <Info className="w-8 h-8 mx-auto mb-2 text-blue-500" />
          <p className="font-medium">Veuillez sélectionner un vétérinaire pour voir ses disponibilités.</p>
        </div>
      )}

      {/* Appointment Booking Modal */}
      <Modal
        isOpen={appointmentModalOpen}
        onRequestClose={() => {
          setAppointmentModalOpen(false);
          setMessage({ type: null, text: null }); // Clear messages on close
        }}
        contentLabel="Prendre rendez-vous"
        className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md mx-auto my-auto outline-none animate-scale-in border border-gray-200"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 backdrop-blur-sm animate-fade-in"
      >
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h3 className="text-2xl font-bold text-teal-700">Confirmer le rendez-vous</h3>
          <button
            onClick={() => {
              setAppointmentModalOpen(false);
              setMessage({ type: null, text: null });
            }}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <XCircle className="w-7 h-7" />
          </button>
        </div>

        {message.type && (
          <div
            className={`px-4 py-3 rounded-lg relative mb-4 animate-fade-in-down flex items-center
              ${message.type === "success" ? "bg-green-100 border border-green-400 text-green-700" : "bg-red-100 border border-red-400 text-red-700"}`}
            role="alert"
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            )}
            <span className="block sm:inline font-medium">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmitAppointment} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <CalendarDays className="w-4 h-4 mr-2 text-indigo-500" />
              Date et heure du rendez-vous :
            </label>
            <input
              type="datetime-local"
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-700 transition duration-200 ease-in-out"
              value={appointmentDateTime}
              onChange={(e) => setAppointmentDateTime(e.target.value)}
              required
            />
            {selectedSlot && (
              <p className="text-xs text-gray-500 mt-1 pl-1 flex items-center">
                <Info className="w-3 h-3 mr-1 text-blue-400" />
                Créneau sélectionné: Du {new Date(selectedSlot.start).toLocaleDateString('fr-FR')} à{" "}
                {new Date(selectedSlot.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                {" "}au {new Date(selectedSlot.end).toLocaleDateString('fr-FR')} à{" "}
                {new Date(selectedSlot.end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="pet-select-modal" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <PawPrint className="w-4 h-4 mr-2 text-orange-500" />
              Animal :
            </label>
            {loadingPets ? (
              <Spinner message="Chargement des animaux..." />
            ) : pets.length === 0 ? (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
                <Info className="w-4 h-4 inline-block mr-1" />
                Vous n'avez pas encore enregistré d'animaux. Veuillez en ajouter un d'abord.
              </div>
            ) : (
              <select
                id="pet-select-modal"
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-700 transition duration-200 ease-in-out hover:border-teal-400"
                value={selectedPetId}
                onChange={(e) => setSelectedPetId(e.target.value)}
                required
              >
                <option value="">Choisir un animal</option>
                {pets.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="reason-textarea" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-purple-500" />
              Motif du rendez-vous :
            </label>
            <textarea
              id="reason-textarea"
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-700 transition duration-200 ease-in-out resize-y"
              value={appointmentReason}
              onChange={(e) => setAppointmentReason(e.target.value)}
              rows="3"
              placeholder="Ex: Vaccin annuel, Consultation générale, etc."
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setAppointmentModalOpen(false);
                setMessage({ type: null, text: null });
              }}
              className="inline-flex items-center px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
            >
              <XCircle className="w-5 h-5 mr-2" /> Annuler
            </button>
            <button
              type="submit"
              disabled={submittingAppointment || pets.length === 0}
              className={`inline-flex items-center px-6 py-2 rounded-lg font-medium transition duration-200 shadow-md transform hover:scale-105 ${
                submittingAppointment || pets.length === 0
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-teal-600 text-white hover:bg-teal-700 hover:shadow-lg"
              }`}
            >
              {submittingAppointment ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span>Confirmation...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" /> Confirmer le rendez-vous
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClientAppointmentScheduler;
