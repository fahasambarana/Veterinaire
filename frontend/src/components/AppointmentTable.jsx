// src/components/AppointmentCalendar.jsx
import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Fonction utilitaire pour extraire le timestamp de création d'un ObjectId MongoDB
const getCreationTimestampFromObjectId = (objectId) => {
  if (!objectId || typeof objectId !== "string" || objectId.length < 24) {
    return 0; // Retourne 0 ou gère l'erreur pour les IDs invalides
  }
  // Les 8 premiers caractères hexadécimaux de l'ObjectId représentent le timestamp UNIX en secondes
  const timestampHex = objectId.substring(0, 8);
  // Convertit en millisecondes pour une utilisation avec `Date`
  return parseInt(timestampHex, 16) * 1000;
};

const AppointmentCalendar = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [user, setUser] = useState(null);
  // MODIFICATION ICI : DÉFINIR 'table' COMME MODE D'AFFICHAGE PAR DÉFAUT
  const [viewMode, setViewMode] = useState("table");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        const userWithId = {
          ...parsed,
          id: parsed.id || parsed._id, // Normalisation: assure que l'ID est toujours sous `user.id`
        };
        console.log("Utilisateur connecté :", userWithId);
        setUser(userWithId);
      } catch (err) {
        console.error("Erreur parsing user from localStorage:", err);
      }
    }
    setLoadingInitial(false); // Informations utilisateur chargées ou tentative effectuée
  }, []);

  console.log("🧪 Check rôle vétérinaire :", {
    userId: user?.id,
    vetId: selectedEvent?.vetId,
    role: user?.role,
    isMatch:
      user?.role === "vet" && String(user?.id) === String(selectedEvent?.vetId),
  });

  const fetchAppointments = async () => {
    // Attendre que les informations utilisateur soient chargées
    // La condition `!user && !loadingInitial` est correcte car `user` peut être null après `setLoadingInitial(false)`
    if (!user && !loadingInitial) {
      console.warn(
        "Utilisateur non chargé, impossible de récupérer les rendez-vous."
      );
      return;
    }
    // Si l'utilisateur est chargé, on peut appeler l'API
    if (user || !loadingInitial) { // Re-check user to ensure it's available after loading
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("Pas de token d'authentification.");
          // Ici, vous pourriez vouloir naviguer vers la page de connexion
          navigate('/login'); // Exemple de redirection
          return;
        }

        const res = await axios.get(`${API_URL}/appointments/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const formatted = res.data.map((rdv) => ({
          id: rdv._id, // Conserver l'ID MongoDB pour le tri par date de création
          title: `🐾 ${rdv.petId?.name || "Animal Inconnu"} - ${
            rdv.reason || "Consultation"
          }`,
          start: rdv.date, // Date du rendez-vous
          end: rdv.date, // Pour les événements "point"
          extendedProps: {
            vet: rdv.vetId?.username || "Vétérinaire inconnu",
            vetId: rdv.vetId?._id?.toString() || rdv.vetId?.toString() || null,
            owner: rdv.ownerId?.username || "Client inconnu",
            ownerId:
              rdv.ownerId?._id?.toString() || rdv.ownerId?.toString() || null,
            petId: rdv.petId?._id?.toString() || rdv.petId?.toString() || null,
            reason: rdv.reason,
            status: rdv.status,
            petName: rdv.petId?.name,
          },
        }));
        setEvents(formatted);
      } catch (error) {
        console.error(
          "Erreur fetch appointments :",
          error.response?.data || error.message
        );
        // Afficher une erreur à l'utilisateur, par ex. via un état local d'erreur
        alert("Erreur lors du chargement des rendez-vous.");
      }
    }
  };

  useEffect(() => {
    // Lancer le fetch seulement après que l'utilisateur soit chargé (ou qu'on ait déterminé qu'il n'y en a pas)
    // `user` est la dépendance clé ici. `loadingInitial` assure que `user` a été "tenté" de charger.
    if (!loadingInitial) { // Once initial loading is done, whether user is present or not
        fetchAppointments();
    }
  }, [user, loadingInitial]); // Dépend de `user` et `loadingInitial`

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
      petId: info.event.extendedProps.petId,
      ownerId: info.event.extendedProps.ownerId,
      owner: info.event.extendedProps.owner,
      reason: info.event.extendedProps.reason,
      status: info.event.extendedProps.status,
      petName: info.event.extendedProps.petName,
    });
  };

  const updateStatus = async (status) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Vous n'êtes pas authentifié pour effectuer cette action.");
        navigate('/login'); // Redirect to login if token is missing
        return;
      }
      await axios.put(
        `${API_URL}/appointments/${selectedEvent.id}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSelectedEvent((prev) => ({ ...prev, status }));
      fetchAppointments(); // Re-fetch pour mettre à jour le calendrier/liste
      alert("Statut du rendez-vous mis à jour avec succès !");
    } catch (error) {
      console.error(
        "Erreur updateStatus :",
        error.response?.data || error.message
      );
      alert(error.response?.data?.message || "Erreur serveur, réessayez.");
    } finally {
      closeModal(); // Ferme la modale après l'action
    }
  };

  const closeModal = () => setSelectedEvent(null);

  const isAssignedVet = () => {
    const isVet = user?.role?.toLowerCase() === "vet";
    // Convertir les deux IDs en String avant comparaison pour s'assurer qu'ils sont du même type
    const isMatchingVetId = String(user?.id) === String(selectedEvent?.vetId);
    return isVet && selectedEvent?.vetId && isMatchingVetId;
  };

  const getStatusBadgeClasses = (status) => {
    switch (status?.toLowerCase()) { // Add optional chaining for safety
      case "en attente":
        return "bg-yellow-100 text-yellow-800";
      case "confirmé":
        return "bg-green-100 text-green-800";
      case "annulé":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // 1. Filtre les événements par statut
  const filteredEvents =
    filterStatus === "all"
      ? events
      : events.filter((e) => e.extendedProps.status === filterStatus);

  // 2. Trie les événements filtrés par date de CRÉATION (les plus récents en premier) pour le tableau
  const sortedFilteredEvents = [...filteredEvents].sort((a, b) => {
    const timestampA = getCreationTimestampFromObjectId(a.id);
    const timestampB = getCreationTimestampFromObjectId(b.id);
    // Trie par ordre décroissant du timestamp de création (plus grand timestamp = plus récent)
    return timestampB - timestampA;
  });

  if (loadingInitial) {
    return (
      <div className="text-center py-8 text-gray-700">
        Chargement des informations utilisateur...
      </div>
    );
  }

  // Restreindre l'accès si l'utilisateur n'est ni vétérinaire ni administrateur
  if (!user || (user.role !== "vet" && user.role !== "admin")) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md text-center text-red-600">
        Vous n'êtes pas autorisé à accéder à cette page de gestion des
        rendez-vous.
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl ml-64 transition-all duration-300 w-[calc(100%-16rem)] pr-8">
      <div className="flex justify-between items-center mb-4 px-4">
        <h2 className="text-2xl font-bold text-teal-700">
          Gestion des rendez-vous
        </h2>
        <div className="flex space-x-4">
          <select
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded px-3 py-1 text-gray-700 focus:ring-teal-500 focus:border-teal-500"
            value={filterStatus}
          >
            <option value="all">Tous les statuts</option>
            <option value="en attente">En attente</option>
            <option value="confirmé">Confirmés</option>
            <option value="annulé">Annulés</option>
          </select>
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-4 py-2 rounded ${
              viewMode === "calendar"
                ? "bg-teal-600 text-white"
                : "bg-gray-200 text-gray-800"
            } hover:bg-teal-700 transition duration-200`}
          >
            Calendrier
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-4 py-2 rounded ${
              viewMode === "table"
                ? "bg-teal-600 text-white"
                : "bg-gray-200 text-gray-800"
            } hover:bg-teal-700 transition duration-200`}
          >
            Liste
          </button>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={filteredEvents} // Le calendrier gère son propre tri visuel
          eventClick={handleEventClick}
          headerToolbar={{ start: "prev,next today", center: "title", end: "" }}
          buttonText={{ today: "Aujourd'hui" }}
          locale="fr"
          timeZone="UTC" // Assurez-vous que le fuseau horaire est cohérent avec vos données
          height="auto"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead className="bg-teal-600 text-white">
              <tr>
                <th className="py-2 px-4 text-left">Animal</th>
                <th className="py-2 px-4 text-left">Date RDV</th>{" "}
                {/* Remplacé "Date" par "Date RDV" pour clarté */}
                <th className="py-2 px-4 text-left">Proprio</th>
                <th className="py-2 px-4 text-left">Vétérinaire</th>
                <th className="py-2 px-4 text-left">Motif</th>
                <th className="py-2 px-4 text-left">Statut</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Utilise sortedFilteredEvents pour le tri par date de création */}
              {sortedFilteredEvents.map((e) => {
                const rdvDate = new Date(e.start).toLocaleString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <tr key={e.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{e.extendedProps.petName}</td>
                    <td className="py-3 px-4">{rdvDate}</td>
                    <td className="py-3 px-4">{e.extendedProps.owner}</td>
                    <td className="py-3 px-4">{e.extendedProps.vet}</td>
                    <td className="py-3 px-4">{e.extendedProps.reason}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(
                          e.extendedProps.status
                        )}`}
                      >
                        {e.extendedProps.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() =>
                          handleEventClick({
                            event: {
                              id: e.id,
                              start: e.start,
                              extendedProps: e.extendedProps,
                            },
                          })
                        }
                        className="text-teal-600 hover:text-teal-800 font-medium"
                      >
                        Détails
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sortedFilteredEvents.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    Aucun rendez-vous trouvé avec ce filtre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold text-teal-700 mb-4">
              Détails du rendez-vous
            </h3>
            <p className="mb-2">
              <strong>Date du rendez-vous :</strong> {selectedEvent.date}
            </p>
            <p className="mb-2">
              <strong>Vétérinaire :</strong> {selectedEvent.vet}
            </p>
            <p className="mb-2">
              <strong>Propriétaire :</strong> {selectedEvent.owner}
            </p>
            <p className="mb-2">
              <strong>Animal :</strong> {selectedEvent.petName}
            </p>
            <p className="mb-2">
              <strong>Motif :</strong> {selectedEvent.reason}
            </p>
            <p className="mb-4">
              <strong>Statut :</strong>{" "}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusBadgeClasses(
                  selectedEvent.status
                )}`}
              >
                {selectedEvent.status}
              </span>
            </p>

            <div className="mt-6">
              {selectedEvent.status === "en attente" && isAssignedVet() ? (
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => updateStatus("confirmé")}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition duration-200"
                  >
                    Approuver
                  </button>
                  <button
                    onClick={() => updateStatus("annulé")}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition duration-200"
                  >
                    Rejeter
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded transition duration-200"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <>
                  {selectedEvent.status === "confirmé" && isAssignedVet() && (
                    <button
                      onClick={() => {
                        closeModal();
                        navigate(`/consultations/${selectedEvent.id}`, { state: selectedEvent });

                      }}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md font-medium mb-4 transition duration-200"
                    >
                      Consulter
                    </button>
                  )}

                  <p className="text-center text-lg text-gray-700 font-medium">
                    Ce rendez-vous est{" "}
                    <span className="capitalize text-teal-700 font-semibold">
                      {selectedEvent.status}
                    </span>
                    .
                  </p>
                  <button
                    onClick={closeModal}
                    className="mt-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded w-full transition duration-200"
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