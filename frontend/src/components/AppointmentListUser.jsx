import React, { useEffect, useState } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const UserAppointmentsList = ({ onAddAppointmentClick, onEditAppointmentClick }) => {
  const { user, loading } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState(null);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState(null); // Nouveau pour le message de succès après suppression

  const fetchAppointments = async () => {
    if (loading) return; // Attendre que le chargement de l'utilisateur soit terminé

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
      } else if (user.role === 'vet') {
        // Si les vétérinaires ont aussi une liste "mine" d'appointments qu'ils gèrent
        // res = await axios.get(`${API_URL}/appointments/vet/mine`, { headers: { Authorization: `Bearer ${token}` } });
        setError("Les vétérinaires gèrent leurs rendez-vous via le calendrier de gestion. Cette page est pour les clients.");
        setIsLoadingAppointments(false);
        return;
      } else {
        setError("Rôle utilisateur non pris en charge pour l'affichage des rendez-vous.");
        setIsLoadingAppointments(false);
        return;
      }

      // Filtrer les rendez-vous annulés si le backend les renvoie
      const activeAppointments = res.data.filter(app => app.status !== 'annulé');
      const sortedAppointments = activeAppointments.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAppointments(sortedAppointments);

    } catch (err) {
      console.error("Erreur lors du chargement des rendez-vous:", err.response?.data || err.message);
      setError(`Échec du chargement des rendez-vous: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  useEffect(() => {
    // Déclenche le rechargement des rendez-vous chaque fois que l'utilisateur ou le statut de chargement change
    fetchAppointments();
  }, [user, loading]); // Dépendances importantes

  const handleEdit = (appointmentId) => {
    if (onEditAppointmentClick) {
      onEditAppointmentClick(appointmentId);
    } else {
      console.warn("onEditAppointmentClick prop not provided to UserAppointmentsList.");
    }
  };

  const handleDelete = async (appointmentId) => {
    if (window.confirm("Êtes-vous sûr de vouloir annuler ce rendez-vous ? Cette action est irréversible.")) {
      setIsDeleting(true);
      setDeleteError(null);
      setDeleteSuccessMessage(null); // Réinitialiser le message de succès précédent

      try {
        const token = localStorage.getItem("token");
        // L'appel DELETE doit être envoyé pour informer le backend de l'annulation/suppression
        await axios.delete(`${API_URL}/appointments/${appointmentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Après l'opération backend réussie, RECHARGER les rendez-vous
        // Cela garantira que la liste affichée est en phase avec la base de données.
        await fetchAppointments();

        setDeleteSuccessMessage("Rendez-vous annulé avec succès !");
        // Disparaître le message de succès après quelques secondes
        setTimeout(() => setDeleteSuccessMessage(null), 3000);

      } catch (err) {
        console.error("Erreur lors de l'annulation du rendez-vous :", err.response?.data || err.message);
        const errorMessage = `Échec de l'annulation: ${err.response?.data?.message || err.message}`;
        setDeleteError(errorMessage);
        // Disparaître le message d'erreur après quelques secondes
        setTimeout(() => setDeleteError(null), 5000);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (loading || isLoadingAppointments) {
    return <div className="text-center py-8 text-gray-700">Chargement des rendez-vous...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong className="font-bold">Erreur :</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 max-w-6xl mx-auto my-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-3xl font-extrabold text-teal-800">Mes Rendez-vous</h2>
        {user && user.role === 'pet-owner' && (
          <button
            onClick={onAddAppointmentClick}
            className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75"
          >
            Ajouter un rendez-vous
          </button>
        )}
      </div>

      {deleteSuccessMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Succès :</strong>
          <span className="block sm:inline"> {deleteSuccessMessage}</span>
        </div>
      )}

      {deleteError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Erreur d'annulation :</strong>
          <span className="block sm:inline"> {deleteError}</span>
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="text-center text-gray-600 py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-lg mb-4">Aucun rendez-vous trouvé pour le moment.</p>
          {user && user.role === 'pet-owner' && (
             <p className="text-md">Cliquez sur le bouton "Ajouter un rendez-vous" ci-dessus pour en prendre un.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((appointment) => (
            <div
              key={appointment._id}
              className={`bg-white p-6 rounded-lg shadow-md border border-teal-100 hover:shadow-lg transition-shadow duration-200 flex flex-col justify-between`}
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
                <p className={`font-bold text-sm mt-3 ${
                    appointment.status === 'confirmé' ? 'text-green-600' :
                    appointment.status === 'en attente' ? 'text-yellow-600' :
                    appointment.status === 'annulé' ? 'text-red-600' : 'text-gray-500' // 'annulé' ne devrait plus apparaître si bien filtré
                }`}>
                  Statut : {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </p>
              </div>

              {/* Action Buttons */}
              {user.role === 'pet-owner' && appointment.status !== 'annulé' && ( // Masquer les boutons si déjà annulé
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end space-x-3">
                  {appointment.status !== 'confirmé' && ( // Permettre la modification seulement si pas encore confirmé ou annulé
                    <button
                      onClick={() => handleEdit(appointment._id)}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-md shadow transition duration-200"
                      disabled={isDeleting}
                    >
                      Modifier
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(appointment._id)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md shadow transition duration-200"
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Annulation...' : 'Annuler'}
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