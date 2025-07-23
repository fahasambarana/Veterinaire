import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom"; // Importez useNavigate et useLocation
import useAuth from "../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ConsultationRecordList = () => {
  const { user } = useAuth();
  const { petId } = useParams(); // Récupérer le petId depuis l'URL s'il existe
  const navigate = useNavigate(); // Hook pour la navigation
  const location = useLocation(); // Hook pour accéder à location.state
  const petNameFromState = location.state?.petName; // Récupérer le nom de l'animal si passé via state

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayedPetName, setDisplayedPetName] = useState(""); // Pour stocker le nom de l'animal à afficher

  useEffect(() => {
    const fetchConsultations = async () => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentification requise. Veuillez vous connecter.");
        setLoading(false);
        // Optionnel: rediriger vers la page de connexion
        // navigate('/login');
        return;
      }

      try {
        // CORRECTION MAJEURE: Adapter les URL à vos routes backend
        const url = petId
          ? `${API_URL}/consultations/pet/${petId}` // Pour une liste filtrée par animal
          : `${API_URL}/consultations/all`; // Pour toutes les consultations

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setConsultations(res.data);

        // Si petId est présent et que petName a été passé via state, l'utiliser.
        // Sinon, si les consultations sont chargées et qu'elles ont un petId,
        // on peut déduire le nom de l'animal de la première consultation (si pertinent).
        if (petId && petNameFromState) {
          setDisplayedPetName(petNameFromState);
        } else if (petId && res.data.length > 0 && res.data[0].petId?.name) {
          setDisplayedPetName(res.data[0].petId.name);
        } else {
            setDisplayedPetName(""); // Réinitialiser si pas de petId ou pas de nom trouvé
        }


      } catch (err) {
        console.error("Erreur chargement consultations :", err.response?.data?.message || err.message, err);
        setError(err.response?.data?.message || "Erreur lors du chargement des consultations. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    };

    // Assurez-vous que l'utilisateur est chargé avant de tenter de récupérer les consultations
    // Cela évite des appels inutiles si le user context n'est pas encore prêt
    if (user) {
      fetchConsultations();
    }
  }, [petId, user, navigate, petNameFromState]); // Ajout de user et navigate aux dépendances

  // Gestion des droits d'accès
  if (!user || (user?.role !== "vet" && user?.role !== "admin")) {
    return (
      <div className="bg-white p-6 rounded shadow-md w-full max-w-lg text-center text-red-600 mx-auto mt-8">
        Vous n'êtes pas autorisé à accéder à cette page de l'historique des consultations.
      </div>
    );
  }

  // États de chargement et d'erreur
  if (loading)
    return <div className="text-center py-8 text-gray-700 mx-auto mt-8">Chargement des consultations...</div>;

  if (error)
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 mx-auto mt-8 max-w-lg">
        <strong className="font-bold">Erreur: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );

  // Pas de consultations trouvées
  if (consultations.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md mx-auto my-8 max-w-4xl text-center text-gray-500">
        {petId && displayedPetName ? (
            <p>Aucune consultation trouvée pour l'animal : <span className="font-semibold text-teal-700">{displayedPetName}</span>.</p>
        ) : (
            <p>Aucune consultation trouvée.</p>
        )}
      </div>
    );
  }

  // Fonction pour naviguer vers le détail/édition de la consultation
  const handleViewOrEdit = (consultationId) => {
    navigate(`/consultation-details/${consultationId}`);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md mx-auto my-8 max-w-6xl">
      <h2 className="text-2xl font-bold text-teal-700 mb-6 text-center">
        Historique des consultations
        {petId && displayedPetName && ` de ${displayedPetName}`}
      </h2>

      {/* Bouton de retour à la liste des animaux si filtré par animal */}
      {petId && (
        <div className="mb-4">
          <button
            onClick={() => navigate('/allPets')}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition duration-200"
          >
            ← Retour à la liste des animaux
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 shadow-sm rounded-lg text-sm">
          <thead className="bg-teal-600 text-white">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Animal</th>
              <th className="p-3 text-left">Vétérinaire</th> {/* Ajout de la colonne Vétérinaire */}
              <th className="p-3 text-left">Poids (kg)</th>
              <th className="p-3 text-left">Température (°C)</th>
              <th className="p-3 text-left">Diagnostic</th>
              <th className="p-3 text-left">Actions</th> {/* Nouvelle colonne pour les actions */}
            </tr>
          </thead>
          <tbody>
            {consultations.map((c) => (
              <tr key={c._id} className="border-t hover:bg-gray-50">
                <td className="p-2">
                  {c.date
                    ? new Date(c.date).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "-"}
                </td>
                <td className="p-2 font-medium">{c.petId?.name || "Inconnu"}</td>
                <td className="p-2">{c.vetId?.username || "Inconnu"}</td> {/* Affichage du nom du vétérinaire */}
                <td className="p-2">{c.weight !== null ? `${c.weight} kg` : "-"}</td>
                <td className="p-2">{c.temperature !== null ? `${c.temperature} °C` : "-"}</td>
                <td className="p-2 max-w-[200px] truncate">{c.diagnosis}</td> {/* Truncate long text */}
                <td className="p-2">
                  <button
                    onClick={() => handleViewOrEdit(c._id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-medium transition duration-200"
                  >
                    Voir/Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ConsultationRecordList;