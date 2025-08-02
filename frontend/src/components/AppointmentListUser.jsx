import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CalendarX,
  Clock,
  CheckCircle,
  Plus,
  Edit,
  XCircle,
  Loader2,
  ArrowLeft,
  Info,
  User,
  PawPrint
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const UserAppointmentsList = ({ onAddAppointmentClick, onEditAppointmentClick }) => {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState(null);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ type: null, message: null });
  const [deletingAppointmentId, setDeletingAppointmentId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const clearStatusMessage = useCallback(() => {
    setTimeout(() => setStatusMessage({ type: null, message: null }), 5000);
  }, []);

  const fetchAppointments = useCallback(async () => {
    if (authLoading || !user || (!user.id && !user._id)) {
      setError("Veuillez vous connecter pour voir vos rendez-vous.");
      setIsLoadingAppointments(false);
      return;
    }

    setIsLoadingAppointments(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentification requise.");

      let res;
      if (user.role === 'pet-owner') {
        res = await axios.get(`${API_URL}/appointments/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        setError("Cette section est dédiée aux propriétaires d'animaux.");
        setIsLoadingAppointments(false);
        return;
      }

      const activeAppointments = res.data.filter(app => app.status !== 'annulé');
      const sortedAppointments = activeAppointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAppointments(sortedAppointments);

    } catch (err) {
      console.error("Erreur lors du chargement:", err.response?.data || err.message);
      setError(`Échec du chargement: ${err.response?.data?.message || err.message}`);
      clearStatusMessage();
    } finally {
      setIsLoadingAppointments(false);
    }
  }, [user, authLoading, clearStatusMessage]);

  useEffect(() => {
    if (user) fetchAppointments();
  }, [fetchAppointments, user]);

  const handleEdit = (appointmentId) => {
    onEditAppointmentClick?.(appointmentId);
  };

  const handleDeleteClick = (appointmentId) => {
    setDeletingAppointmentId(appointmentId);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    setShowConfirmModal(false);
    setStatusMessage({ type: 'loading', message: "Annulation en cours..." });

    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_URL}/appointments/${deletingAppointmentId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAppointments(prevApps => prevApps.filter(app => app._id !== deletingAppointmentId));
      setStatusMessage({ type: 'success', message: "Rendez-vous annulé avec succès !" });
      clearStatusMessage();
      
    } catch (err) {
      console.error("Erreur lors de l'annulation:", err.response?.data || err.message);
      setStatusMessage({ type: 'error', message: `Échec: ${err.response?.data?.message || err.message}` });
      clearStatusMessage();
    } finally {
      setDeletingAppointmentId(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setDeletingAppointmentId(null);
  };

  const Spinner = ({ className = "h-5 w-5" }) => (
    <div className={`flex justify-center items-center ${className}`}>
      <Loader2 className="animate-spin text-teal-600" />
    </div>
  );

  if (authLoading || isLoadingAppointments) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-700 max-w-lg mx-auto my-8">
        <Spinner className="h-12 w-12" />
        <p className="mt-4 text-lg font-medium">Chargement des rendez-vous...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mx-auto my-8 max-w-2xl animate-fade-in-down">
        <p className="font-bold">Erreur</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-white rounded-2xl max-w-7xl mx-auto my-8 font-sans shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Mes Rendez-vous</h2>
          <p className="text-gray-500 mt-1">Gérez vos rendez-vous vétérinaires</p>
        </div>
        
        {user?.role === 'pet-owner' && (
          <button
            onClick={onAddAppointmentClick}
            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-medium rounded-full shadow-lg transition-all duration-300 hover:shadow-xl flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> 
            <span>Nouveau rendez-vous</span>
          </button>
        )}
      </div>

      {/* Status Messages */}
      {statusMessage.message && (
        <div
          className={`px-4 py-3 rounded-lg mb-6 text-white font-medium shadow-md transition-all duration-300
            ${statusMessage.type === 'success' ? 'bg-green-500' :
              statusMessage.type === 'error' ? 'bg-red-500' :
              'bg-teal-500'} flex items-center justify-center gap-2`}
        >
          {statusMessage.type === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
          {statusMessage.message}
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
          <CalendarX className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun rendez-vous</h3>
          {user?.role === 'pet-owner' && (
            <p className="text-gray-500 max-w-md">
              Vous n'avez pas encore de rendez-vous. Cliquez sur "Nouveau rendez-vous" pour en programmer un.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((appointment) => (
            <div
              key={appointment._id}
              className={`bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 group
                ${deletingAppointmentId === appointment._id ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${
                    appointment.status === 'confirmé' ? 'bg-green-100 text-green-600' :
                    appointment.status === 'terminé' ? 'bg-teal-100 text-teal-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {format(new Date(appointment.date), "EEEE d MMMM", { locale: fr })}
                    </p>
                    <p className="text-gray-600">
                      {format(new Date(appointment.date), "HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  appointment.status === 'confirmé' ? 'bg-green-100 text-green-800' :
                  appointment.status === 'terminé' ? 'bg-teal-100 text-teal-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <PawPrint className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Animal</p>
                    <p className="font-medium">
                      {appointment.petId?.name || 'Non spécifié'} ({appointment.petId?.species || 'Inconnu'})
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-purple-100 p-2 rounded-lg mr-3">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vétérinaire</p>
                    <p className="font-medium">
                      {appointment.vetId?.username || 'Non spécifié'}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Motif</p>
                  <p className="font-medium">{appointment.reason}</p>
                </div>
              </div>

              {user?.role === 'pet-owner' && appointment.status === 'en attente' && (
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(appointment._id)}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    disabled={!!deletingAppointmentId}
                  >
                    <Edit className="w-4 h-4" /> Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteClick(appointment._id)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    disabled={!!deletingAppointmentId}
                  >
                    {deletingAppointmentId === appointment._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Annuler
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md transform transition-all duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-red-100 rounded-full mb-4">
                <Info className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Annuler le rendez-vous</h3>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir annuler ce rendez-vous ? Cette action est irréversible.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Non, garder
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Oui, annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAppointmentsList;