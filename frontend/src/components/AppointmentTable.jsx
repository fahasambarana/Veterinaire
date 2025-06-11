import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";

const AppointmentCalendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState("calendar"); // 'calendar' ou 'table'
  const [filterStatus, setFilterStatus] = useState("all"); // Filtre par statut

  // Styles dynamiques avec sidebar
  const containerClasses = `bg-white p-4 rounded-xl ml-64 transition-all duration-300 ${
    viewMode === "calendar"
      ? "w-[calc(100%-16rem)] max-w-4xl ml-64 pr-8"
      : "w-[calc(100%-16rem)] pr-8"
  }`;

  // Styles spécifiques pour un calendrier plus compact
  const calendarClasses = {
    headerToolbar: {
      left: "prev,next",
      center: "title",
      right: "today",
    },
    buttonText: {
      today: "Aujourd'hui",
    },
    views: {
      dayGrid: {
        dayMaxEventRows: 2, // Limite le nombre d'événements visibles par jour
      },
    },
    height: "auto",
    aspectRatio: 1.5, // Rend le calendrier plus compact
    contentHeight: "auto",
    dayCellContent: {
      textAlign: "center",
    },
  };

  // Récupération des données utilisateur depuis localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (err) {
        console.error("Erreur parsing user:", err);
      }
    }
  }, []);

  // Récupération des rendez-vous
  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/api/appointments/all",
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
          petName: rdv.petId?.name || "Animal Inconnu",
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

  // Clic sur un événement
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

  // Mettre à jour le statut
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

  // Vérifie si l'utilisateur connecté est le vétérinaire assigné
  const isAssignedVet = () => {
    return (
      user?.role === "vet" && String(user?.id) === String(selectedEvent?.vetId)
    );
  };

  // Filtrer les rendez-vous selon le statut
  const filteredEvents =
    filterStatus === "all"
      ? events
      : events.filter((event) => event.extendedProps.status === filterStatus);

  return (
    <div className={containerClasses}>
      <div className="flex justify-between items-center mb-4 px-4">
        <h2 className="text-2xl font-bold text-teal-700">
          Gestion des rendez-vous
        </h2>
        <div className="flex space-x-4">
          <select
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value="all">Tous les statuts</option>
            <option value="en attente">En attente</option>
            <option value="confirmé">Confirmés</option>
            <option value="annulé">Annulés</option>
          </select>
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-4 py-2 rounded ${
              viewMode === "calendar" ? "bg-teal-600 text-white" : "bg-gray-200"
            }`}
          >
            Calendrier
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-4 py-2 rounded ${
              viewMode === "table" ? "bg-teal-600 text-white" : "bg-gray-200"
            }`}
          >
            Liste
          </button>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={filteredEvents}
          eventClick={handleEventClick}
          height="auto"
          headerToolbar={{
            start: "prev,next today",
            center: "title",
            end: "",
          }}
          buttonText={{
            today: "Aujourd'hui",
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
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead className="bg-teal-600 text-white">
              <tr>
                <th className="py-3 px-4 text-left">Animal</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Propriétaire</th>
                <th className="py-3 px-4 text-left">Vétérinaire</th>
                <th className="py-3 px-4 text-left">Motif</th>
                <th className="py-3 px-4 text-left">Statut</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => {
                const eventDate = new Date(event.date);
                const formattedDate = eventDate.toLocaleString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <tr key={event.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{event.extendedProps.petName}</td>
                    <td className="py-3 px-4">{formattedDate}</td>
                    <td className="py-3 px-4">{event.extendedProps.owner}</td>
                    <td className="py-3 px-4">{event.extendedProps.vet}</td>
                    <td className="py-3 px-4">{event.extendedProps.reason}</td>
                    <td className="py-3 px-4 capitalize">
                      {event.extendedProps.status}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          setSelectedEvent({
                            id: event.id,
                            title: event.title,
                            date: formattedDate,
                            vet: event.extendedProps.vet,
                            vetId: event.extendedProps.vetId,
                            owner: event.extendedProps.owner,
                            reason: event.extendedProps.reason,
                            status: event.extendedProps.status,
                          });
                        }}
                        className="text-teal-600 hover:text-teal-800"
                      >
                        Détails
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredEvents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun rendez-vous trouvé
            </div>
          )}
        </div>
      )}

      {/* Modal des détails */}
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

            <div className="mt-4">
              {selectedEvent.status === "en attente" && isAssignedVet() ? (
                <div className="flex justify-between">
                  <button
                    onClick={() => updateStatus("confirmé")}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Approuver
                  </button>
                  <button
                    onClick={() => updateStatus("annulé")}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Rejeter
                  </button>
                  <button
                    onClick={closeModal}
                    className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
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
