""// src/components/ConsultationRecordList.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import LayoutSidebar from "./LayoutSidebar";
import {
  CalendarDays,
  PawPrint,
  Stethoscope,
  Weight,
  Thermometer,
  FileText,
  Eye,
  ArrowLeft,
  Loader2,
  Info,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ConsultationRecordList = () => {
  const { user } = useAuth();
  const { petId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const petNameFromState = location.state?.petName;

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayedPetName, setDisplayedPetName] = useState("");

  useEffect(() => {
    const fetchConsultations = async () => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentification requise. Veuillez vous connecter.");
        setLoading(false);
        return;
      }

      try {
        const url = petId
          ? `${API_URL}/consultations/pet/${petId}`
          : `${API_URL}/consultations/all`;

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setConsultations(res.data);

        if (petId && petNameFromState) {
          setDisplayedPetName(petNameFromState);
        } else if (petId && res.data.length > 0 && res.data[0].petId?.name) {
          setDisplayedPetName(res.data[0].petId.name);
        } else {
          setDisplayedPetName("");
        }
      } catch (err) {
        console.error("Erreur chargement consultations :", err);
        setError(err.response?.data?.message || "Erreur lors du chargement des consultations.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchConsultations();
    }
  }, [petId, user, navigate, petNameFromState]);

  const handleViewOrEdit = (consultationId) => {
    navigate(`/consultation-details/${consultationId}`);
  };

  if (!user || (user?.role !== "vet" && user?.role !== "admin")) {
    return (
      <LayoutSidebar>
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center text-red-600 mx-auto mt-20 border border-red-200 animate-fade-in-down">
          <h3 className="text-2xl font-bold mb-4">Accès Refusé</h3>
          <p>Vous n'êtes pas autorisé à accéder à cette page de l'historique des consultations.</p>
        </div>
      </LayoutSidebar>
    );
  }

  if (loading)
    return (
      <LayoutSidebar>
        <div className="flex flex-col justify-center items-center min-h-[400px] text-gray-700 bg-gray-50 rounded-xl shadow-md mx-auto my-8 animate-pulse">
          <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-3" />
          <p className="text-lg">Chargement des consultations...</p>
        </div>
      </LayoutSidebar>
    );

  if (error)
    return (
      <LayoutSidebar>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 mx-auto mt-8 max-w-lg shadow-md animate-fade-in-down">
          <strong className="font-bold">Erreur: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </LayoutSidebar>
    );

  return (
    <LayoutSidebar>
      <div className="w-full">
        <div className="bg-white p-8 ml-[-300px] rounded-xl  border border-gray-200 animate-fade-in">
          <h2 className="text-3xl font-extrabold text-teal-700 mb-8 text-center">
            Historique des consultations
            {petId && displayedPetName && ` de ${displayedPetName}`}
          </h2>

          {petId && (
            <div className="mb-6">
              <button
                onClick={() => navigate('/allPets')}
                className="inline-flex items-center px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-200 transform hover:scale-105 shadow-md"
              >
                <ArrowLeft className="w-5 h-5 mr-2" /> Retour à la liste des animaux
              </button>
            </div>
          )}

          {consultations.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-xl shadow-sm text-center text-gray-500 border border-gray-200">
              <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              {petId && displayedPetName ? (
                <p className="text-lg">Aucune consultation trouvée pour l'animal : <span className="font-semibold text-teal-700">{displayedPetName}</span>.</p>
              ) : (
                <p className="text-lg">Aucune consultation trouvée pour le moment.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-teal-700 text-white">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-bold uppercase tracking-wider rounded-tl-lg">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-bold uppercase tracking-wider">
                       Animal
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-bold uppercase tracking-wider">
                       Vétérinaire
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-bold uppercase tracking-wider">
                      Poids (kg)
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-bold uppercase tracking-wider">
                      Température (°C)
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-bold uppercase tracking-wider">
                      Diagnostic
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-bold uppercase tracking-wider rounded-tr-lg">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {consultations.map((c) => (
                    <tr key={c._id} className="hover:bg-teal-50 transition duration-150">
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {c.date ? new Date(c.date).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }) : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {c.petId?.name || "Inconnu"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {c.vetId?.username || "Inconnu"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {c.weight !== null ? `${c.weight} kg` : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {c.temperature !== null ? `${c.temperature} °C` : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-[250px] truncate" title={c.diagnosis}>
                        {c.diagnosis}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleViewOrEdit(c._id)}
                          className="inline-flex items-center bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md transition transform hover:scale-105 shadow-sm"
                        >
                          <Eye className="w-4 h-4 mr-2" /> Voir/Modifier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </LayoutSidebar>
  );
};

export default ConsultationRecordList;
