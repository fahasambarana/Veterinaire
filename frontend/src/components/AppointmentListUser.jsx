import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarX, Clock, CheckCircle, Plus, Edit, XCircle } from 'lucide-react'; // Added Plus, Edit, XCircle icons

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const UserAppointmentsList = ({ onAddAppointmentClick, onEditAppointmentClick }) => {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState(null);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [deletingAppointmentId, setDeletingAppointmentId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState(null);

  // Utility to clear messages after a timeout
  const clearMessages = (setter) => {
    setTimeout(() => setter(null), 5000); // Clear after 5 seconds
  };

  const fetchAppointments = useCallback(async () => {
    if (authLoading) return;

    if (!user || (!user.id && !user._id)) {
      setError("Veuillez vous connecter pour voir vos rendez-vous.");
      setIsLoadingAppointments(false);
      return;
    }

    setIsLoadingAppointments(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      let res;

      if (user.role === 'pet-owner') {
        res = await axios.get(`${API_URL}/appointments/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (user.role === 'vet' || user.role === 'admin') {
        setError("Cette section est dédiée aux rendez-vous des propriétaires d'animaux. Les vétérinaires et administrateurs gèrent les rendez-vous via le calendrier général.");
        setIsLoadingAppointments(false);
        return;
      } else {
        setError("Rôle utilisateur non pris en charge pour l'affichage des rendez-vous.");
        setIsLoadingAppointments(false);
        return;
      }

      const activeAppointments = res.data.filter(app => app.status !== 'annulé');
      const sortedAppointments = activeAppointments.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAppointments(sortedAppointments);

    } catch (err) {
      console.error("Erreur lors du chargement des rendez-vous:", err.response?.data || err.message);
      setError(`Échec du chargement des rendez-vous: ${err.response?.data?.message || err.message}`);
      clearMessages(setError);
    } finally {
      setIsLoadingAppointments(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleEdit = (appointmentId) => {
    if (onEditAppointmentClick) {
      onEditAppointmentClick(appointmentId);
    } else {
      console.warn("onEditAppointmentClick prop not provided to UserAppointmentsList.");
    }
  };

  const handleDelete = async (appointmentId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler ce rendez-vous ? Cette action est irréversible.")) {
      return;
    }

    setDeletingAppointmentId(appointmentId);
    setDeleteError(null);
    setDeleteSuccessMessage(null);

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAppointments(prevApps => prevApps.filter(app => app._id !== appointmentId));

      setDeleteSuccessMessage("Rendez-vous annulé avec succès !");
      clearMessages(setDeleteSuccessMessage);

    } catch (err) {
      console.error("Erreur lors de l'annulation du rendez-vous :", err.response?.data || err.message);
      const errorMessage = `Échec de l'annulation: ${err.response?.data?.message || err.message}`;
      setDeleteError(errorMessage);
      clearMessages(setDeleteError);
      fetchAppointments();
    } finally {
      setDeletingAppointmentId(null);
    }
  };

  // Spinner Component
  const Spinner = () => (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></div>
    </div>
  );

  // Global Loading State
  if (authLoading || isLoadingAppointments) {
    return (
      <div className="text-center py-12 text-gray-700 max-w-lg mx-auto my-8">
        <Spinner />
        <p className="mt-4 text-lg">Chargement des rendez-vous...</p>
      </div>
    );
  }

  // Global Error State
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 mx-auto mt-8 max-w-lg animate-fade-in-down" role="alert">
        <strong className="font-bold">Erreur :</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl mt-[-10px] max-w-6xl mx-auto my-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-3xl font-extrabold text-teal-800">Mes Rendez-vous</h2>
        {user && user.role === 'pet-owner' && (
          <button
            onClick={onAddAppointmentClick}
            className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-md transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Ajouter un rendez-vous
          </button>
        )}
      </div>

      {/* Success and Error Messages */}
      {deleteSuccessMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 animate-fade-in-down" role="alert">
          <strong className="font-bold">Succès :</strong>
          <span className="block sm:inline"> {deleteSuccessMessage}</span>
        </div>
      )}

      {deleteError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 animate-fade-in-down" role="alert">
          <strong className="font-bold">Erreur d'annulation :</strong>
          <span className="block sm:inline"> {deleteError}</span>
        </div>
      )}

      {/* Empty State */}
      {appointments.length === 0 ? (
        <div className="text-center text-gray-600 py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center">
          <CalendarX className="w-16 h-16 text-gray-400 mb-4" />
          <p className="text-lg mb-4 font-medium">Aucun rendez-vous trouvé pour le moment.</p>
          {user && user.role === 'pet-owner' && (
             <p className="text-md">Cliquez sur le bouton "<span className="font-semibold text-teal-700">Ajouter un rendez-vous</span>" ci-dessus pour en prendre un.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((appointment) => (
            <div
              key={appointment._id}
              className={`bg-white p-6 rounded-lg shadow-md border border-teal-100 hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col justify-between
                ${deletingAppointmentId === appointment._id ? 'opacity-70 grayscale' : ''} `}
            >
              <div>
                <p className="text-xl font-bold text-teal-800 mb-3">
                  {format(new Date(appointment.date), "EEEE d MMMM yyyy à HH:mm", { locale: fr })}
                </p>
                <p className="text-gray-700 mb-1">
                  <span className="font-semibold">Motif :</span> {appointment.reason}
                </p>
                {user.role === 'pet-owner' && appointment.vetId && (
                  <p className="text-gray-700 mb-1">
                    <span className="font-semibold">Vétérinaire :</span> {appointment.vetId.username || 'Non spécifié'}
                  </p>
                )}
                {appointment.petId && (
                  <p className="text-gray-700 mb-2">
                    <span className="font-semibold">Animal :</span> {appointment.petId.name || 'Non spécifié'} ({appointment.petId.species || 'Inconnu'})
                  </p>
                )}
                <p className={`font-bold text-sm mt-3 flex items-center gap-1 ${
                    appointment.status === 'confirmé' ? 'text-green-600' :
                    appointment.status === 'en attente' ? 'text-yellow-600' :
                    'text-gray-500'
                }`}>
                  Statut :
                  {appointment.status === 'confirmé' && <CheckCircle className="w-4 h-4" />}
                  {appointment.status === 'en attente' && <Clock className="w-4 h-4" />}
                  <span className="ml-1">{appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</span>
                </p>
              </div>

              {/* Action Buttons */}
              {user.role === 'pet-owner' && appointment.status !== 'annulé' && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end space-x-3">
                  {appointment.status !== 'confirmé' && (
                    <button
                      onClick={() => handleEdit(appointment._id)}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-md shadow transition duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                      disabled={deletingAppointmentId === appointment._id}
                    >
                      <Edit className="w-4 h-4" /> Modifier
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(appointment._id)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md shadow transition duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                    disabled={deletingAppointmentId === appointment._id}
                  >
                    {deletingAppointmentId === appointment._id ? (
                      <>
                        <Spinner /> Annulation...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" /> Annuler
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserAppointmentsList;