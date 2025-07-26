import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid"; // Import for week/day views
import Modal from "react-modal";
import useAuth from "../hooks/useAuth"; // Import your useAuth hook
import {
  CalendarDays, // For date inputs
  Clock, // For time/duration
  CheckCircle, // For success/submit
  XCircle, // For error/close
  Loader2, // For loading
  PlusCircle, // For add button/empty state
  Edit, // For edit button
  Trash2, // For delete button
  Info, // For general info/error alerts
} from "lucide-react"; // Import Lucide icons

Modal.setAppElement("#root"); // Important for accessibility

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const CalendrierDisponibilites = () => {
  const { user, loading: authLoading } = useAuth();

  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState("Disponible");
  const [editingEvent, setEditingEvent] = useState(null);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [globalMessage, setGlobalMessage] = useState({ type: "", text: "" }); // { type: 'success' | 'error', text: '...' }
  const [loadingEvents, setLoadingEvents] = useState(true); // New state for fetching events
  const [isSubmitting, setIsSubmitting] = useState(false); // New state for form submission/deletion

  // Utility to clear messages after a timeout
  const clearGlobalMessage = useCallback(() => {
    setTimeout(() => setGlobalMessage({ type: "", text: "" }), 5000);
  }, []);

  const fetchEvents = useCallback(async () => {
    if (authLoading || !user || !user.id || user.role !== "vet") {
      setGlobalMessage({
        type: "error",
        text: "Chargement de l'utilisateur ou rôle non autorisé pour voir le calendrier.",
      });
      clearGlobalMessage();
      setEvents([]);
      setLoadingEvents(false);
      return;
    }

    setLoadingEvents(true);
    setGlobalMessage({ type: "", text: "" }); // Clear previous messages

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setGlobalMessage({ type: "error", text: "Authentification requise." });
        clearGlobalMessage();
        setLoadingEvents(false);
        return;
      }

      const res = await axios.get(`${API_URL}/disponibilites/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formatted = res.data.map((d) => {
        const eventVetId =
          typeof d.vetId === "object" && d.vetId !== null
            ? d.vetId.toString()
            : String(d.vetId);

        return {
          id: d._id, // MongoDB _id
          title: d.type,
          start: d.date_debut,
          end: d.date_fin,
          // Adjusted colors for better visual distinction and style
          color: d.type === "Indisponible" ? "#DC2626" : "#059669", // Tailwind red-600, emerald-600
          extendedProps: {
            vetId: eventVetId,
            type: d.type,
          },
        };
      });
      setEvents(formatted);
      setGlobalMessage({ type: "", text: "" }); // Clear any previous error
    } catch (err) {
      console.error("Erreur lors du chargement des disponibilités :", err.response?.data?.message || err.message);
      setGlobalMessage({
        type: "error",
        text: `Échec du chargement des disponibilités : ${err.response?.data?.message || err.message}`,
      });
      clearGlobalMessage();
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, [authLoading, user, clearGlobalMessage]); // Depend on authLoading, user, and clearGlobalMessage

  useEffect(() => {
    // Only fetch if user data is loaded and it's a vet
    if (!authLoading && user && user.role === "vet") {
      fetchEvents();
    }
  }, [authLoading, user, fetchEvents]); // Depend on loading, user, and fetchEvents

  const handleDateClick = (arg) => {
    if (!user || user.role !== "vet") {
      setGlobalMessage({ type: "error", text: "Seuls les vétérinaires peuvent ajouter des disponibilités." });
      clearGlobalMessage();
      return;
    }
    const defaultStart = arg.dateStr + "T09:00"; // Default start at 9 AM
    const defaultEnd = arg.dateStr + "T17:00";   // Default end at 5 PM
    setDateDebut(defaultStart);
    setDateFin(defaultEnd);
    setType("Disponible");
    setEditingEvent(null); // Clear editing state for new entry
    setModalOpen(true);
    setGlobalMessage({ type: "", text: "" }); // Clear any previous error on modal open
  };

  const handleEventClick = (arg) => {
    // Ensure the event belongs to the current user before allowing modification
    if (
      !user ||
      user.role !== "vet" ||
      String(arg.event.extendedProps.vetId) !== String(user.id)
    ) {
      setGlobalMessage({ type: "error", text: "Vous ne pouvez pas modifier les disponibilités d'un autre vétérinaire." });
      clearGlobalMessage();
      return; // Prevent opening modal for unauthorized events
    }

    setEditingEvent(arg.event);
    // Use toISOString().slice(0, 16) to format Date objects to "YYYY-MM-DDTHH:MM" for datetime-local input
    setDateDebut(new Date(arg.event.start).toISOString().slice(0, 16));
    setDateFin(
      arg.event.end
        ? new Date(arg.event.end).toISOString().slice(0, 16)
        : new Date(arg.event.start).toISOString().slice(0, 16) // Fallback if end is null
    );
    setType(arg.event.extendedProps.type);
    setModalOpen(true);
    setGlobalMessage({ type: "", text: "" }); // Clear any previous error on modal open
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalMessage({ type: "", text: "" }); // Clear previous messages
    setIsSubmitting(true);

    if (!user || user.role !== "vet" || !user.id) {
      setGlobalMessage({
        type: "error",
        text: "Impossible de créer/modifier la disponibilité : Informations de l'utilisateur manquantes ou rôle non autorisé.",
      });
      clearGlobalMessage();
      setIsSubmitting(false);
      return;
    }

    if (!dateDebut || !dateFin || !type) {
      setGlobalMessage({ type: "error", text: "Veuillez remplir tous les champs requis." });
      clearGlobalMessage();
      setIsSubmitting(false);
      return;
    }
    if (new Date(dateDebut) >= new Date(dateFin)) {
      setGlobalMessage({ type: "error", text: "La date de fin doit être postérieure à la date de début." });
      clearGlobalMessage();
      setIsSubmitting(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setGlobalMessage({ type: "error", text: "Vous n'êtes pas authentifié." });
      clearGlobalMessage();
      setIsSubmitting(false);
      return;
    }

    const payload = {
      vetId: user.id,
      date_debut: dateDebut,
      date_fin: dateFin,
      type,
    };

    try {
      if (editingEvent) {
        if (String(editingEvent.extendedProps.vetId) !== String(user.id)) {
          setGlobalMessage({ type: "error", text: "Vous n'êtes pas autorisé à modifier cette disponibilité." });
          clearGlobalMessage();
          setIsSubmitting(false);
          return;
        }
        await axios.put(
          `${API_URL}/disponibilites/${editingEvent.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setGlobalMessage({ type: "success", text: "Disponibilité modifiée avec succès !" });
      } else {
        await axios.post(`${API_URL}/disponibilites`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGlobalMessage({ type: "success", text: "Disponibilité ajoutée avec succès !" });
      }
      setModalOpen(false);
      fetchEvents(); // Refresh events after successful operation
      clearGlobalMessage();
    } catch (err) {
      console.error(
        "Erreur lors de l'enregistrement de la disponibilité :",
        err.response?.data || err.message
      );
      setGlobalMessage({
        type: "error",
        text: `Échec de l'enregistrement : ${
          err.response?.data?.message || err.message
        }`,
      });
      clearGlobalMessage();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setGlobalMessage({ type: "", text: "" }); // Clear previous messages
    setIsSubmitting(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setGlobalMessage({ type: "error", text: "Vous n'êtes pas authentifié." });
      clearGlobalMessage();
      setIsSubmitting(false);
      return;
    }

    if (
      !user ||
      !editingEvent ||
      String(editingEvent.extendedProps.vetId) !== String(user.id)
    ) {
      setGlobalMessage({ type: "error", text: "Vous n'êtes pas autorisé à supprimer cette disponibilité." });
      clearGlobalMessage();
      setIsSubmitting(false);
      return;
    }

    // Using a custom confirmation instead of window.confirm for better UX
    const confirmDelete = window.confirm("Êtes-vous sûr de vouloir supprimer cette disponibilité ?");
    if (!confirmDelete) {
      setIsSubmitting(false);
      return;
    }

    try {
      await axios.delete(`${API_URL}/disponibilites/${editingEvent.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGlobalMessage({ type: "success", text: "Disponibilité supprimée avec succès !" });
      setModalOpen(false);
      fetchEvents();
      clearGlobalMessage();
    } catch (err) {
      console.error(
        "Erreur lors de la suppression de la disponibilité :",
        err.response?.data || err.message
      );
      setGlobalMessage({
        type: "error",
        text: `Échec de la suppression : ${
          err.response?.data?.message || err.message
        }`,
      });
      clearGlobalMessage();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Global loading for initial user authentication check
  if (authLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 text-gray-700">
        <Loader2 className="w-12 h-12 animate-spin text-teal-600 mb-4" />
        <p className="text-xl font-semibold">Chargement des informations utilisateur...</p>
      </div>
    );
  }

  // Access control check
  if (!user || user.role !== "vet") {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg text-center text-red-600 mx-auto mt-20 border border-red-200 animate-fade-in-down">
        <h3 className="text-2xl font-bold mb-4">Accès Refusé</h3>
        <p>Vous n'êtes pas autorisé à accéder à cette page. Seuls les vétérinaires peuvent gérer les disponibilités.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-teal-700">
        Planning des disponibilités
      </h2>

      {/* Global Notification Display */}
      {globalMessage.text && (
        <div
          className={`absolute top-4 left-1/2 -translate-x-1/2 p-3 rounded-lg shadow-lg text-white text-sm font-semibold z-50 transition-all duration-300 transform ${
            globalMessage.type === "success" ? "bg-green-500" : "bg-red-500"
          } ${globalMessage.text ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
          role="alert"
        >
          {globalMessage.text}
        </div>
      )}

      {loadingEvents ? (
        <div className="flex flex-col justify-center items-center min-h-[400px] text-gray-700 bg-gray-50 rounded-xl shadow-md mx-auto my-8">
          <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-3" />
          <p className="text-lg">Chargement des disponibilités...</p>
        </div>
      ) : (
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]} // Added timeGridPlugin
          initialView="dayGridMonth"
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          events={events}
          height="auto"
          locale="fr"
          timeZone="local" // Set timezone to local
          nowIndicator={true} // Show current time indicator
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay", // Added week/day views
          }}
          buttonText={{
            today: "Aujourd'hui",
            month: "Mois",
            week: "Semaine",
            day: "Jour",
          }}
          selectable={true}
          validRange={{
            start: new Date(), // Only dates from today onwards are selectable/viewable
          }}
          eventTimeFormat={{ // Ensure time display is clear
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false
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
          className="shadow-md rounded-lg"
        />
      )}

      <Modal
        isOpen={modalOpen}
        onRequestClose={() => {
          setModalOpen(false);
          setGlobalMessage({ type: "", text: "" }); // Clear messages on close
        }}
        contentLabel="Disponibilité"
        className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md mx-auto my-auto outline-none border border-gray-200 transform scale-95 animate-scale-in relative"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4 animate-fade-in"
      >
        <button
          onClick={() => {
            setModalOpen(false);
            setGlobalMessage({ type: "", text: "" });
          }}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition duration-200"
          title="Fermer"
        >
          <XCircle className="w-7 h-7" />
        </button>
        <h3 className="text-2xl font-bold mb-6 text-teal-700 border-b pb-3">
          {editingEvent ? "Modifier" : "Ajouter"} une disponibilité
        </h3>
        {globalMessage.text && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm font-semibold ${
              globalMessage.type === "success" ? "bg-green-100 text-green-800 border border-green-400" : "bg-red-100 text-red-800 border border-red-400"
            }`}
            role="alert"
          >
            {globalMessage.text}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative group">
            <label
              htmlFor="dateDebut"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Début :
            </label>
            <div className="flex items-center border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all duration-200">
              <CalendarDays className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0 group-focus-within:text-teal-600 transition-colors duration-200" />
              <input
                type="datetime-local"
                id="dateDebut"
                className="flex-grow p-2.5 bg-transparent rounded-r-md outline-none"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="relative group">
            <label
              htmlFor="dateFin"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Fin :
            </label>
            <div className="flex items-center border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all duration-200">
              <CalendarDays className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0 group-focus-within:text-teal-600 transition-colors duration-200" />
              <input
                type="datetime-local"
                id="dateFin"
                className="flex-grow p-2.5 bg-transparent rounded-r-md outline-none"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="relative group">
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Type :
            </label>
            <div className="flex items-center border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all duration-200">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-600 transition-colors duration-200 w-5 h-5" />
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 shadow-sm appearance-none cursor-pointer"
              >
                <option value="Disponible">Disponible</option>
                <option value="Indisponible">Indisponible</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {editingEvent && (
              <button
                type="button"
                onClick={handleDelete}
                className={`bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-md shadow-md transition duration-150 ease-in-out flex items-center justify-center gap-2 transform hover:scale-105
                  ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                Supprimer
              </button>
            )}
            <button
              type="submit"
              className={`bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2.5 rounded-md shadow-md transition duration-150 ease-in-out flex items-center justify-center gap-2 transform hover:scale-105
                ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingEvent ? <Edit className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
              {isSubmitting ? "Enregistrement..." : editingEvent ? "Modifier" : "Ajouter"}
            </button>
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                setGlobalMessage({ type: "", text: "" });
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-5 py-2.5 rounded-md shadow-sm transition duration-150 ease-in-out transform hover:scale-105"
            >
              Annuler
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CalendrierDisponibilites;
