import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  PawPrint,
  CalendarCheck,
  Weight,
  Thermometer,
  ClipboardList,
  FileText,
  User,
  ChevronLeft,
  Image as ImageIcon,
  Info,
  Stethoscope,
  Edit,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const IMAGE_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads`
  : "http://localhost:5000/uploads/pets";

const PetDetails = ({ pet, onBack, navigateToConsultation }) => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConsultations = async () => {
      if (!pet?._id) {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentification requise.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`${API_URL}/consultations/pet/${pet._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setConsultations(res.data);
      } catch (err) {
        console.error("Erreur chargement consultations :", err);
        setError(
          err.response?.data?.message || "Erreur lors du chargement des consultations."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchConsultations();
  }, [pet]);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 w-full max-w-5xl mx-auto my-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
        <button
          onClick={onBack}
          className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition duration-200 ease-in-out font-medium shadow-sm hover:shadow-md"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Retour
        </button>
        <h2 className="text-3xl font-extrabold text-teal-800 text-center flex-grow">
          Détails de l’animal
        </h2>
        <div className="w-24"></div> {/* Placeholder */}
      </div>

      {/* Animal info */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10 bg-gradient-to-r from-teal-50 to-blue-50 p-6 rounded-xl shadow-inner">
        {pet.image ? (
          <div className="w-48 h-48 flex-shrink-0 relative rounded-full overflow-hidden border-4 border-teal-400 shadow-lg">
            <img
              src={`${IMAGE_BASE_URL}/${pet.image}`}
              alt={pet.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/placeholder-pet.png";
                e.target.classList.add("bg-gray-200", "p-4", "object-contain");
              }}
            />
            <div className="absolute inset-0 rounded-full border-4 border-white opacity-20"></div>
          </div>
        ) : (
          <div className="w-48 h-48 flex-shrink-0 relative rounded-full flex items-center justify-center bg-gray-200 text-gray-500 border-4 border-gray-300 shadow-lg">
            <ImageIcon className="w-24 h-24" />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-gray-800 flex-grow">
          <p className="text-lg flex items-center">
            <Info className="w-5 h-5 mr-3 text-teal-600 flex-shrink-0" />
            <strong className="text-gray-700">Nom :</strong>{" "}
            <span className="font-semibold text-teal-700 ml-2">{pet.name || "-"}</span>
          </p>
          <p className="text-lg flex items-center">
            <PawPrint className="w-5 h-5 mr-3 text-blue-600 flex-shrink-0" />
            <strong className="text-gray-700">Espèce :</strong>{" "}
            <span className="ml-2">{pet.species || "-"}</span>
          </p>
          <p className="text-lg flex items-center">
            <CalendarCheck className="w-5 h-5 mr-3 text-purple-600 flex-shrink-0" />
            <strong className="text-gray-700">Âge :</strong>{" "}
            <span className="ml-2">{pet.age ? `${pet.age} an(s)` : "-"}</span>
          </p>
          <p className="text-lg flex items-center">
            <User className="w-5 h-5 mr-3 text-green-600 flex-shrink-0" />
            <strong className="text-gray-700">Sexe :</strong>{" "}
            <span className="ml-2">{pet.gender || "-"}</span>
          </p>
        </div>
      </div>

      {/* Historique médical */}
      <div className="mt-12 pt-6 border-t border-gray-200">
        <h3 className="text-2xl font-bold text-teal-700 mb-6 flex items-center">
          <ClipboardList className="w-7 h-7 mr-3 text-teal-600" /> Historique médical
        </h3>

        {loading && (
          <p className="text-gray-500 text-center py-4">Chargement des consultations...</p>
        )}
        {error && (
          <p className="text-red-500 font-medium text-center py-4">{error}</p>
        )}
        {!loading && !error && consultations.length === 0 && (
          <p className="text-gray-500 italic text-center py-4">
            Aucune consultation enregistrée pour cet animal.
          </p>
        )}

        {!loading && consultations.length > 0 && (
          <ul className="space-y-6">
            {consultations.map((c) => (
              <li
                key={c._id}
                className="p-6 border border-teal-200 rounded-lg bg-teal-50 shadow-md hover:shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer"
                onClick={() => navigateToConsultation && navigateToConsultation(c._id)}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6">
                  <p className="flex items-center text-gray-700">
                    <CalendarCheck className="w-5 h-5 mr-2 text-teal-600" />
                    <strong>Date :</strong>{" "}
                    <span className="font-medium ml-2">
                      {new Date(c.createdAt || c.date).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </p>
                  <p className="flex items-center text-gray-700">
                    <Stethoscope className="w-5 h-5 mr-2 text-blue-600" />
                    <strong>Vétérinaire :</strong>{" "}
                    <span className="ml-2">{c.vetId?.username || "Inconnu"}</span>
                  </p>
                  <p className="flex items-center text-gray-700">
                    <Weight className="w-5 h-5 mr-2 text-purple-600" />
                    <strong>Poids :</strong>{" "}
                    <span className="ml-2">{c.weight ? `${c.weight} kg` : "Non renseigné"}</span>
                  </p>
                  <p className="flex items-center text-gray-700">
                    <Thermometer className="w-5 h-5 mr-2 text-red-600" />
                    <strong>Température :</strong>{" "}
                    <span className="ml-2">{c.temperature ? `${c.temperature} °C` : "Non renseigné"}</span>
                  </p>
                  <p className="col-span-1 md:col-span-2 lg:col-span-3 flex items-start text-gray-700">
                    <FileText className="w-5 h-5 mr-2 text-green-600 flex-shrink-0 mt-1" />
                    <strong>Diagnostic :</strong>{" "}
                    <span className="ml-2 whitespace-pre-wrap">{c.diagnosis || "Non renseigné"}</span>
                  </p>
                  <p className="col-span-1 md:col-span-2 lg:col-span-3 flex items-start text-gray-700">
                    <Edit className="w-5 h-5 mr-2 text-orange-600 flex-shrink-0 mt-1" />
                    <strong>Traitement :</strong>{" "}
                    <span className="ml-2 whitespace-pre-wrap">{c.treatment || "Non renseigné"}</span>
                  </p>
                  {c.notes && (
                    <p className="col-span-1 md:col-span-2 lg:col-span-3 flex items-start text-gray-700">
                      <Edit className="w-5 h-5 mr-2 text-gray-600 flex-shrink-0 mt-1" />
                      <strong>Notes :</strong>{" "}
                      <span className="ml-2 whitespace-pre-wrap">{c.notes}</span>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PetDetails;
