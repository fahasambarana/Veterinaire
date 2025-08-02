import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";

const AppointmentCalendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        const userWithNormalizedId = {
          ...parsedUser,
          id: parsedUser.id || parsedUser._id,
        };
        console.log("User chargé :", userWithNormalizedId); // DEBUG
        setUser(userWithNormalizedId);
      } catch (err) {
        console.error("Erreur parsing user:", err);
      }
    }
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/api/appointments/mine",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const formattedEvents = res.data.map((rdv) => ({
        id: rdv._id,
        title: `🐾 ${rdv.petId?.name || "Animal Inconnu"} - ${
          rdv.reason || "Consultation"
        }`,
        date: rdv.date,
        extendedProps: {
          vet: rdv.vetId?.username || "Vétérinaire inconnu",
          vetId: rdv.vetId?._id || rdv.vetId,
          owner: rdv.ownerId?.username || "Client inconnu",
          reason: rdv.reason || "Consultation",
          status: rdv.status || "en attente",
        },
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Erreur chargement des rendez-vous :", error);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleEventClick = (info) => {
    setSelectedEvent({
      id: info.event.id,
      title: info.event.title,
      date: new Date(info.event.start).toLocaleString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      vet: info.event.extendedProps.vet,
      vetId: info.event.extendedProps.vetId,
      owner: info.event.extendedProps.owner,
      reason: info.event.extendedProps.reason,
      status: info.event.extendedProps.status,
    });
  };

  // ✅ Fonction corrigée
  const isAssignedVet = () => {
    if (!user || !selectedEvent) return false;
    const isVet = user.role?.toLowerCase() === "vet";
    const isOwner = String(user.id) === String(selectedEvent.vetId);
    console.log("Vérif rôle:", user.role, "| VetID match:", isOwner); // DEBUG
    return isVet && isOwner;
  };

  const updateStatus = async (status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/appointments/${selectedEvent.id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedEvent((prev) => ({
        ...prev,
        status,
      }));
      fetchAppointments();
    } catch (error) {
      console.error("Erreur mise à jour statut :", error);
      if (error.response?.status === 403) {
        alert(error.response.data.message || "Accès interdit.");
      } else if (error.response?.status === 404) {
        alert("Rendez-vous introuvable.");
      } else {
        alert("Erreur serveur. Veuillez réessayer.");
      }
    }
  };

  const closeModal = () => setSelectedEvent(null);

  return (
    <div className="bg-white p-6 rounded-xl relative">
      

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
        height="auto"
        headerToolbar={{
          start: "prev,next today",
          center: "title",
          end: "",
        }}
        locale="fr"
        timeZone="UTC"
        dayCellClassNames={(info) => {
          const dateStr = info.date.toISOString().split("T")[0];
          const hasEvent = events.some(
            (event) => event.date && event.date.startsWith(dateStr)
          );
          if (hasEvent) {
            return [
              "bg-blue-100",
              "rounded-md",
              "transition",
              "duration-300",
              "text-black",
            ];
          }
          return [];
        }}
      />

      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-96">
            <h3 className="text-xl font-semibold text-teal-700 mb-2">
              Détails du rendez-vous
            </h3>
            <p>
              <strong>Animal & Motif :</strong> {selectedEvent.title}
            </p>
            <p>
              <strong>Date :</strong> {selectedEvent.date}
            </p>
            <p>
              <strong>Propriétaire :</strong> {selectedEvent.owner}
            </p>
            <p>
              <strong>Vétérinaire :</strong> {selectedEvent.vet}
            </p>
            <p>
              <strong>Statut :</strong>{" "}
              <span className="capitalize">{selectedEvent.status}</span>
            </p>

            <div className="mt-2 text-xs text-gray-500">
              <p>UserID: {user?.id}, Role: {user?.role}</p>
              <p>VetID: {selectedEvent.vetId}</p>
              <p>
                isAssignedVet:{" "}
                {isAssignedVet() ? "true ✅" : "false ❌"}
              </p>
            </div>

            <div className="mt-4">
              {selectedEvent.status === "en attente" && isAssignedVet() ? (
                <div className="flex justify-between gap-2">
                  <button
                    onClick={() => updateStatus("confirmé")}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex-1"
                  >
                    Approuver
                  </button>
                  <button
                    onClick={() => updateStatus("annulé")}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex-1"
                  >
                    Rejeter
                  </button>
                  <button
                    onClick={closeModal}
                    className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 flex-1"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <>
                  <p className="mt-4 text-center text-lg text-green-700 font-medium">
                    Ce rendez-vous est{" "}
                    <span className="capitalize">{selectedEvent.status}</span>.
                  </p>
                  <button
                    onClick={closeModal}
                    className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full"
                  >
                    Fermer
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;
