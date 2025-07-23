// CalendrierDisponibilites.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import Modal from "react-modal";
import useAuth from "../hooks/useAuth"; // Import your useAuth hook

Modal.setAppElement("#root");

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const CalendrierDisponibilites = () => {
  const { user, loading } = useAuth();

  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState("Disponible");
  const [editingEvent, setEditingEvent] = useState(null);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [error, setError] = useState(null);

  // CalendrierDisponibilites.jsx
  // ... (imports and useState definitions) ...

  const fetchEvents = async () => {
    if (loading || !user || !user.id || user.role !== "vet") {
      setError(
        "Chargement de l'utilisateur ou rôle non autorisé pour voir le calendrier."
      );
      setEvents([]);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/disponibilites/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formatted = res.data.map((d) => {
        // --- Debugging for this specific issue ---
        console.log("fetchEvents - Raw d.vetId from backend:", d.vetId);
        console.log("fetchEvents - Type of raw d.vetId:", typeof d.vetId);
        if (typeof d.vetId === "object" && d.vetId !== null) {
          console.log(
            "fetchEvents - d.vetId is an object! Attempting .toString()"
          );
        }
        // --- End Debugging ---

        // The crucial change: Use .toString() if d.vetId is an object,
        // otherwise ensure it's converted to a string.
        const eventVetId =
          typeof d.vetId === "object" && d.vetId !== null
            ? d.vetId.toString() // Convert ObjectId object to string
            : String(d.vetId); // Ensure it's a string if it's already primitive

        console.log(
          "fetchEvents - Final eventVetId for extendedProps:",
          eventVetId
        ); // Final check

        return {
          id: d._id, // MongoDB _id
          title: d.type,
          start: d.date_debut,
          end: d.date_fin,
          color: d.type === "Indisponible" ? "red" : "green",
          extendedProps: {
            vetId: eventVetId, // Use the reliably converted string ID
            type: d.type,
          },
        };
      });
      setEvents(formatted);
      setError(null);
    } catch (err) {
      console.error("Erreur lors du chargement des disponibilités :", err);
      setError("Échec du chargement des disponibilités. Veuillez réessayer.");
    }
  };

  // ... (rest of your component code, including handleEventClick and handleSubmit) ...

  useEffect(() => {
    // Only fetch if user data is loaded and it's a vet
    if (!loading && user && user.role === "vet") {
      fetchEvents();
    }
  }, [loading, user]); // Depend on loading and user state

  const handleDateClick = (arg) => {
    if (!user || user.role !== "vet") {
      setError("Seuls les vétérinaires peuvent ajouter des disponibilités.");
      return;
    }
    const defaultStart = arg.dateStr + "T09:00";
    const defaultEnd = arg.dateStr + "T17:00";
    setDateDebut(defaultStart);
    setDateFin(defaultEnd);
    setType("Disponible");
    setEditingEvent(null); // Clear editing state for new entry
    setModalOpen(true);
  };

  const handleEventClick = (arg) => {
    // Ensure the event belongs to the current user before allowing modification
    // Compare string versions of IDs for robustness
    console.log(
      "handleEventClick - Event's vetId:",
      String(arg.event.extendedProps.vetId)
    ); // <-- ADD THIS
    console.log("handleEventClick - Logged-in user's ID:", String(user.id)); // <-- ADD THIS

    if (
      !user ||
      user.role !== "vet" ||
      String(arg.event.extendedProps.vetId) !== String(user.id)
    ) {
      setError(
        "Vous ne pouvez pas modifier les disponibilités d'un autre vétérinaire."
      );
      return; // Prevent opening modal for unauthorized events
    }

    setEditingEvent(arg.event);
    setDateDebut(arg.event.start.toISOString().slice(0, 16));
    setDateFin(
      arg.event.end
        ? arg.event.end.toISOString().slice(0, 16)
        : arg.event.start.toISOString().slice(0, 16)
    );
    setType(arg.event.extendedProps.type);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!user || user.role !== "vet" || !user.id) {
      setError(
        "Impossible de créer/modifier la disponibilité : Informations de l'utilisateur manquantes ou rôle non autorisé."
      );
      return;
    }

    if (!dateDebut || !dateFin || !type) {
      setError("Veuillez remplir tous les champs requis.");
      return;
    }
    if (new Date(dateDebut) >= new Date(dateFin)) {
      setError("La date de fin doit être postérieure à la date de début.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Vous n'êtes pas authentifié.");
      return;
    }

    // Always use the authenticated user's ID for vetId when submitting
    const payload = {
      vetId: user.id, // This should already be a string from useAuth hook normalization
      date_debut: dateDebut,
      date_fin: dateFin,
      type,
    };

    try {
      if (editingEvent) {
        // Double-check authorization on client-side before sending update request
        if (String(editingEvent.extendedProps.vetId) !== String(user.id)) {
          setError("Vous n'êtes pas autorisé à modifier cette disponibilité.");
          return;
        }
        await axios.put(
          `${API_URL}/disponibilites/${editingEvent.id}`,
          payload, // Send the payload with the current user's vetId
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(`${API_URL}/disponibilites`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setModalOpen(false);
      fetchEvents(); // Refresh events after successful operation
    } catch (err) {
      console.error(
        "Erreur lors de l'enregistrement de la disponibilité :",
        err.response?.data || err.message
      );
      setError(
        `Échec de l'enregistrement : ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  const handleDelete = async () => {
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Vous n'êtes pas authentifié.");
      return;
    }

    // Ensure the event being deleted belongs to the current user
    if (
      !user ||
      !editingEvent ||
      String(editingEvent.extendedProps.vetId) !== String(user.id)
    ) {
      setError("Vous n'êtes pas autorisé à supprimer cette disponibilité.");
      return;
    }

    if (
      window.confirm("Êtes-vous sûr de vouloir supprimer cette disponibilité ?")
    ) {
      try {
        await axios.delete(`${API_URL}/disponibilites/${editingEvent.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setModalOpen(false);
        fetchEvents();
      } catch (err) {
        console.error(
          "Erreur lors de la suppression de la disponibilité :",
          err.response?.data || err.message
        );
        setError(
          `Échec de la suppression : ${
            err.response?.data?.message || err.message
          }`
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        Chargement des informations utilisateur...
      </div>
    );
  }

  if (!user || user.role !== "vet") {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md text-center text-red-600">
        Vous n'êtes pas autorisé à accéder à cette page. Seuls les vétérinaires
        peuvent gérer les disponibilités.
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-teal-700">
        Planning des disponibilités
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
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        events={events}
        height="auto"
        locale="fr"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "",
        }}
        buttonText={{
          today: "Aujourd'hui",
        }}
        selectable={true}
        validRange={{
          start: new Date(), // Seules les dates à partir d'aujourd'hui seront sélectionnables
        }}
      />

      <Modal
        isOpen={modalOpen}
        onRequestClose={() => {
          setModalOpen(false);
          setError(null);
        }}
        contentLabel="Disponibilité"
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-auto my-auto outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50"
      >
        <h3 className="text-xl font-semibold mb-4 text-teal-700">
          {editingEvent ? "Modifier" : "Ajouter"} une disponibilité
        </h3>
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative mb-4 text-sm"
            role="alert"
          >
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="dateDebut"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Début :
            </label>
            <input
              type="datetime-local"
              id="dateDebut"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="dateFin"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Fin :
            </label>
            <input
              type="datetime-local"
              id="dateFin"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Type :
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="Disponible">Disponible</option>
              <option value="Indisponible">Indisponible</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            {editingEvent && (
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out"
              >
                Supprimer
              </button>
            )}
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out"
            >
              {editingEvent ? "Modifier" : "Ajouter"}
            </button>
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
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

export default CalendrierDisponibilites;
