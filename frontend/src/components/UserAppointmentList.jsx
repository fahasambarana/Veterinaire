import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const UserAppointmentsList = () => {
  const [appointments, setAppointments] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Récupérer les données utilisateur
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (err) {
        console.error("Erreur parsing user:", err);
      }
    }
  }, []);

  // Récupérer les rendez-vous de l'utilisateur
  useEffect(() => {
    const fetchUserAppointments = async () => {
      if (!user) return;

      try {
        const token = localStorage.getItem("token");
        let endpoint = "";
        
        if (user.role === "vet") {
          endpoint = `http://localhost:5000/api/appointments/vet/${user.id}`;
        } else {
          endpoint = `http://localhost:5000/api/appointments/user/${user.id}`;
        }

        const res = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setAppointments(res.data);
      } catch (error) {
        console.error("Erreur chargement des rendez-vous :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAppointments();
  }, [user]);

  // Formater la date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const handleNewAppointment = () => {
    navigate("/nouveau-rdv"); // Redirection vers la page du formulaire
  };

  if (loading) {
    return <div className="text-center py-8">Chargement en cours...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-teal-700">Mes Rendez-vous</h2>
        {user?.role === "user" && (
          <button
            onClick={handleNewAppointment}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg shadow flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Nouveau RDV
          </button>
        )}
      </div>
      
      {appointments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucun rendez-vous trouvé
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-teal-600 text-white">
              <tr>
                <th className="py-3 px-4 text-left">Animal</th>
                <th className="py-3 px-4 text-left">Date</th>
                {user?.role === "user" && <th className="py-3 px-4 text-left">Vétérinaire</th>}
                {user?.role === "vet" && <th className="py-3 px-4 text-left">Client</th>}
                <th className="py-3 px-4 text-left">Motif</th>
                <th className="py-3 px-4 text-left">Statut</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{appointment.petId?.name || "N/A"}</td>
                  <td className="py-3 px-4">{formatDate(appointment.date)}</td>
                  {user?.role === "user" && (
                    <td className="py-3 px-4">{appointment.vetId?.username || "N/A"}</td>
                  )}
                  {user?.role === "vet" && (
                    <td className="py-3 px-4">{appointment.ownerId?.username || "N/A"}</td>
                  )}
                  <td className="py-3 px-4">{appointment.reason || "Consultation"}</td>
                  <td className="py-3 px-4 capitalize">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      appointment.status === "confirmé" ? "bg-green-100 text-green-800" :
                      appointment.status === "annulé" ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {appointment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserAppointmentsList;