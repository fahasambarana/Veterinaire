// src/components/AppointmentCalendar.jsx
import React, { useEffect, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays, // For Date
  User, // For Owner
  Stethoscope, // For Vet
  PawPrint, // For Pet
  ClipboardList, // For Reason
  CheckCircle, // For Status
  Info, // For Details/Actions
  Loader2, // For loading state
  XCircle, // For close button in modal
} from "lucide-react"; // Importation d'icônes Lucide

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
  const [viewMode, setViewMode] = useState("table");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(false); // Nouveau state pour le chargement des RDV
  const [globalMessage, setGlobalMessage] = useState({ type: "", text: "" }); // { type: 'success' | 'error', text: '...' }
  const [updatingStatus, setUpdatingStatus] = useState(false); // New state for status update loading

  // Utility to clear messages after a timeout
  const clearGlobalMessage = useCallback(() => {
    setTimeout(() => setGlobalMessage({ type: "", text: "" }), 5000);
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        const userWithId = {
          ...parsed,
          id: parsed.id || parsed._id, // Normalisation: assure que l'ID est toujours sous `user.id`
        };
        setUser(userWithId);
      } catch (err) {
        console.error("Erreur parsing user from localStorage:", err);
        setGlobalMessage({ type: "error", text: "Erreur de chargement des informations utilisateur." });
        clearGlobalMessage();
      }
    }
    setLoadingInitial(false); // Informations utilisateur chargées ou tentative effectuée
  }, [clearGlobalMessage]);

  const fetchAppointments = useCallback(async () => {
    if (!user && !loadingInitial) {
      console.warn(
        "Utilisateur non chargé, impossible de récupérer les rendez-vous."
      );
      return;
    }
    if (user || !loadingInitial) { // Ensure user is available or initial loading is done
      setLoadingAppointments(true); // Début du chargement des RDV
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setGlobalMessage({ type: "error", text: "Pas de token d'authentification. Veuillez vous reconnecter." });
          clearGlobalMessage();
          navigate('/login');
          return;
        }

        const res = await axios.get(`${API_URL}/appointments/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const formatted = res.data.map((rdv) => ({
          id: rdv._id,
          title: `🐾 ${rdv.petId?.name || "Animal Inconnu"} - ${
            rdv.reason || "Consultation"
          }`,
          start: rdv.date, // Keep the original date string for proper parsing
          end: rdv.date,
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
        setGlobalMessage({ type: "error", text: error.response?.data?.message || "Erreur lors du chargement des rendez-vous." });
        clearGlobalMessage();
      } finally {
        setLoadingAppointments(false); // Fin du chargement des RDV
      }
    }
  }, [user, loadingInitial, navigate, clearGlobalMessage]); // Added navigate and clearGlobalMessage to dependencies

  useEffect(() => {
    if (!loadingInitial) {
        fetchAppointments();
    }
  }, [user, loadingInitial, fetchAppointments]); // Added fetchAppointments to dependencies

  const handleEventClick = (info) => {
    setSelectedEvent({
      id: info.event.id, // This is the appointment ID
      title: info.event.title,
      // Use info.event.start here as well for consistency in the modal's selectedEvent object
      // This 'date' property is for display only in the modal.
      date: new Date(info.event.start).toLocaleString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      start: info.event.start, // Store the original start date string for passing to navigation
      vet: info.event.extendedProps.vet,
      vetId: info.event.extendedProps.vetId,
      petId: info.event.extendedProps.petId, // Pet ID is available here
      ownerId: info.event.extendedProps.ownerId,
      owner: info.event.extendedProps.owner,
      reason: info.event.extendedProps.reason,
      status: info.event.extendedProps.status,
      petName: info.event.extendedProps.petName,
    });
  };

  const updateStatus = async (status) => {
    setUpdatingStatus(true); // Start status update loading
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setGlobalMessage({ type: "error", text: "Vous n'êtes pas authentifié pour effectuer cette action." });
        clearGlobalMessage();
        navigate('/login');
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
      fetchAppointments(); // Re-fetch to ensure data consistency
      setGlobalMessage({ type: "success", text: "Statut du rendez-vous mis à jour avec succès !" });
      clearGlobalMessage();
    } catch (error) {
      console.error(
        "Erreur updateStatus :",
        error.response?.data || error.message
      );
      setGlobalMessage({ type: "error", text: error.response?.data?.message || "Erreur serveur lors de la mise à jour du statut." });
      clearGlobalMessage();
    } finally {
      setUpdatingStatus(false); // End status update loading
      closeModal();
    }
  };

  const closeModal = () => setSelectedEvent(null);

  const isAssignedVet = useCallback(() => {
    const isVet = user?.role?.toLowerCase() === "vet";
    const isMatchingVetId = String(user?.id) === String(selectedEvent?.vetId);
    return isVet && selectedEvent?.vetId && isMatchingVetId;
  }, [user, selectedEvent]); // Added selectedEvent to dependencies

  const getStatusBadgeClasses = (status) => {
    switch (status?.toLowerCase()) {
      case "en attente":
        return "bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-600/20";
      case "confirmé":
        return "bg-green-100 text-green-800 ring-1 ring-inset ring-green-600/20";
      case "annulé":
        return "bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/20";
      case "terminé":
        return "bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-600/20";
      default:
        return "bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-600/20";
    }
  };

  const filteredEvents =
    filterStatus === "all"
      ? events
      : events.filter((e) => e.extendedProps.status === filterStatus);

  const sortedFilteredEvents = [...filteredEvents].sort((a, b) => {
    // Primary sort: By creation timestamp (most recent first)
    const timestampA = getCreationTimestampFromObjectId(a.id);
    const timestampB = getCreationTimestampFromObjectId(b.id);
    if (timestampA !== timestampB) {
      return timestampB - timestampA; // Sort by creation timestamp (newest first)
    }

    // Secondary sort (if creation timestamps are identical): By appointment date (most recent first)
    const dateA = new Date(a.start);
    const dateB = new Date(b.start);
    return dateB.getTime() - dateA.getTime();
  });

  if (loadingInitial) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] text-gray-700 bg-gray-50 rounded-xl shadow-md mx-auto my-8">
        <Loader2 className="w-10 h-10 animate-spin mr-3 text-teal-600" />
        <p className="mt-3 text-lg">Chargement des informations utilisateur...</p>
      </div>
    );
  }

  if (!user || (user.role !== "vet" && user.role !== "admin")) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center text-red-600 mx-auto my-8 border border-red-200 animate-fade-in-down">
        Vous n'êtes pas autorisé à accéder à cette page de gestion des
        rendez-vous.
      </div>
    );
  }

  return (
    <div className="bg-white ml-64 p-6 rounded-xl shadow-xl border border-gray-100 w-[5/4]">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 px-2">
        <h2 className="text-2xl font-bold text-teal-700 mb-4 sm:mb-0">
          Gestion des rendez-vous
        </h2>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <select
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:ring-teal-500 focus:border-teal-500 shadow-sm transition-all duration-200"
            value={filterStatus}
          >
            <option value="all">Tous les statuts</option>
            <option value="en attente">En attente</option>
            <option value="confirmé">Confirmés</option>
            <option value="annulé">Annulés</option>
            <option value="terminé">Terminés</option>
          </select>
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-5 py-2 rounded-lg font-medium transition duration-200 transform hover:scale-105 shadow-md
              ${viewMode === "calendar"
                ? "bg-teal-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
          >
            Calendrier
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-5 py-2 rounded-lg font-medium transition duration-200 transform hover:scale-105 shadow-md
              ${viewMode === "table"
                ? "bg-teal-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
          >
            Liste
          </button>
        </div>
      </div>

      {/* Global Success/Error Message Display */}
      {globalMessage.text && (
        <div
          className={`px-4 py-3 rounded-lg relative mb-4 animate-fade-in-down ${
            globalMessage.type === "success"
              ? "bg-green-100 border border-green-400 text-green-700"
              : "bg-red-100 border border-red-400 text-red-700"
          }`}
          role="alert"
        >
          <strong className="font-bold">{globalMessage.type === "success" ? "Succès :" : "Erreur :"}</strong>
          <span className="block sm:inline"> {globalMessage.text}</span>
        </div>
      )}

      {loadingAppointments ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-8 h-8 animate-spin mr-3 text-teal-600" />
          <p className="text-lg text-gray-600">Chargement des rendez-vous...</p>
        </div>
      ) : viewMode === "calendar" ? (
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={filteredEvents}
          eventClick={handleEventClick}
          headerToolbar={{ start: "prev,next today", center: "title", end: "" }}
          buttonText={{ today: "Aujourd'hui" }}
          locale="fr"
          timeZone="UTC"
          height="auto"
          className="shadow-md rounded-lg"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md animate-fade-in">
          <table className="min-w-full divide-y divide-gray-200 table-auto">
            <thead className="bg-teal-700 text-white rounded-t-lg">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase ">
                  <PawPrint className="w-4 h-4  mr-2 inline" /> Animal
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase ">
                  <CalendarDays className="w-4 h-4  mr-2 inline " /> Date RDV
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase ">
                  <User className="w-4 h-4  mr-2 inline" /> Propriétaire
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase ">
                  <Stethoscope className="w-4 h-4  mr-2 inline" /> Vétérinaire
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase ">
                  <ClipboardList className="w-4 h-4  mr-2 inline" /> Motif
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase min-w-[100px]">
                  <CheckCircle className="w-4 h-4  mr-2 inline" /> Statut
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider min-w-[100px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {sortedFilteredEvents.map((e) => {
                const rdvDate = new Date(e.start).toLocaleString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <tr key={e.id} className="hover:bg-teal-50 transition-colors duration-150 ease-in-out">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{e.extendedProps.petName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{rdvDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{e.extendedProps.owner}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{e.extendedProps.vet}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate" title={e.extendedProps.reason}>{e.extendedProps.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClasses(
                          e.extendedProps.status
                        )}`}
                      >
                        {e.extendedProps.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                        className="text-teal-600 hover:text-teal-800 font-medium inline-flex items-center transition duration-200 transform hover:scale-105"
                      >
                        <Info className="w-4 h-4 mr-1" /> Détails
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sortedFilteredEvents.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500 text-lg italic">
                    Aucun rendez-vous trouvé avec ce filtre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 transform scale-95 animate-scale-in relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition duration-200"
              title="Fermer"
            >
              <XCircle className="w-7 h-7" />
            </button>
            <h3 className="text-2xl font-bold text-teal-700 mb-5 border-b pb-3">
              Détails du rendez-vous
            </h3>
            <div className="space-y-3 text-gray-800">
              <p className="flex items-center">
                <CalendarDays className="w-5 h-5 mr-3 text-teal-600 flex-shrink-0" />
                <strong>Date du rendez-vous :</strong> <span className="ml-2">{selectedEvent.date}</span>
              </p>
              <p className="flex items-center">
                <Stethoscope className="w-5 h-5 mr-3 text-blue-600 flex-shrink-0" />
                <strong>Vétérinaire :</strong> <span className="ml-2">{selectedEvent.vet}</span>
              </p>
              <p className="flex items-center">
                <User className="w-5 h-5 mr-3 text-purple-600 flex-shrink-0" />
                <strong>Propriétaire :</strong> <span className="ml-2">{selectedEvent.owner}</span>
              </p>
              <p className="flex items-center">
                <PawPrint className="w-5 h-5 mr-3 text-green-600 flex-shrink-0" />
                <strong>Animal :</strong> <span className="ml-2">{selectedEvent.petName}</span>
              </p>
              <p className="flex items-center">
                <ClipboardList className="w-5 h-5 mr-3 text-orange-600 flex-shrink-0" />
                <strong>Motif :</strong> <span className="ml-2">{selectedEvent.reason}</span>
              </p>
              <p className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-3 text-gray-600 flex-shrink-0" />
                <strong>Statut :</strong>{" "}
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ml-2 ${getStatusBadgeClasses(
                    selectedEvent.status
                  )}`}
                >
                  {selectedEvent.status}
                </span>
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200">
              {selectedEvent.status === "en attente" && isAssignedVet() ? (
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    onClick={() => updateStatus("confirmé")}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition duration-200 transform hover:scale-105 shadow-md flex items-center justify-center gap-2"
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />} Approuver
                  </button>
                  <button
                    onClick={() => updateStatus("annulé")}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition duration-200 transform hover:scale-105 shadow-md flex items-center justify-center gap-2"
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />} Rejeter
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-4 py-3 rounded-lg transition duration-200 transform hover:scale-105 shadow-md"
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
                        // Navigate to a consultation creation/form page,
                        // passing appointmentId and petId as state
                        navigate('/consultations/create', {
                          state: {
                            appointmentId: selectedEvent.id, // This is the appointment ID
                            petId: selectedEvent.petId, // This is the pet ID
                            vetId: user.id, // Pass the current vet's ID
                            // FIX: Use selectedEvent.start which is the original ISO string
                            prefillDate: new Date(selectedEvent.start).toISOString().split('T')[0],
                            prefillReason: selectedEvent.reason, // Pre-fill reason
                            prefillPetName: selectedEvent.petName // Pre-fill pet name for display
                          }
                        });
                      }}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 rounded-lg font-medium mb-4 transition duration-200 transform hover:scale-105 shadow-md"
                    >
                      Consulter
                    </button>
                  )}

                  <p className="text-center text-lg text-gray-700 font-medium mb-4">
                    Ce rendez-vous est{" "}
                    <span className={`capitalize font-semibold ${getStatusBadgeClasses(selectedEvent.status)}`}>
                      {selectedEvent.status}
                    </span>
                    .
                  </p>
                  <button
                    onClick={closeModal}
                    className="mt-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg w-full transition duration-200 transform hover:scale-105 shadow-md"
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
