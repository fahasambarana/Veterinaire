import React, { useEffect, useState } from "react";
import axios from "axios";

// API_URL reste pour les appels d'API (ex: /api/consultations)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// IMAGE_BASE_URL doit pointer vers le chemin d'accès statique configuré dans Express pour les images des animaux.
// Puisque Express sert 'uploads/pets' sous '/uploads', l'URL de base est 'http://localhost:5000/uploads'.
const IMAGE_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads`
  : "http://localhost:5000/uploads/pets";


const PetDetails = ({ pet, onBack }) => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Vérification de la construction de l'URL pour le débogage
    console.log("Valeur de pet.image:", pet?.image);
    console.log("IMAGE_BASE_URL:", IMAGE_BASE_URL);
    console.log("URL de l'image construite (maintenant):", pet?.image ? `${IMAGE_BASE_URL}/${pet.image}` : "N/A");


    const fetchConsultations = async () => {
      if (!pet?._id) return;

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentification requise.");
        setLoading(false);
        return;
      }

      try {
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
  }, [pet, API_URL, IMAGE_BASE_URL]); // Ajout de IMAGE_BASE_URL aux dépendances

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 w-full max-w-4xl mx-auto my-8">
      <h2 className="text-3xl font-extrabold text-teal-800 mb-6 text-center">
        Détails de l’animal
      </h2>

      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
        {pet.image && (
          <div className="w-40 h-40 flex-shrink-0 relative">
            <img
              src={`${IMAGE_BASE_URL}/${pet.image}`} // Chemin d'accès corrigé
              alt={pet.name}
              className="w-full h-full object-cover rounded-full border-4 border-teal-500 shadow-md"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/placeholder-pet.png"; // Image de secours
                e.target.classList.add("bg-gray-200", "p-2");
              }}
            />
            <div className="absolute inset-0 rounded-full border-4 border-white opacity-20"></div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-gray-800 flex-grow">
          <p className="text-lg">
            <strong>Nom :</strong>{" "}
            <span className="font-semibold text-teal-700">{pet.name || "-"}</span>
          </p>
          <p className="text-lg">
            <strong>Espèce :</strong> {pet.species || "-"}
          </p>
          <p className="text-lg">
            <strong>Âge :</strong> {pet.age ? `${pet.age} an(s)` : "-"}
          </p>
          <p className="text-lg">
            <strong>Sexe :</strong> {pet.gender || "-"}
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-center md:justify-start">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition duration-200 ease-in-out font-medium"
        >
          ← Retour à la liste
        </button>
      </div>

      <div className="mt-12 pt-6 border-t border-gray-200">
        <h3 className="text-2xl font-semibold text-teal-700 mb-6">
          Historique médical
        </h3>

        {loading && <p className="text-gray-500">Chargement des consultations...</p>}
        {error && <p className="text-red-500 font-medium">{error}</p>}
        {!loading && !error && consultations.length === 0 && (
          <p className="text-gray-500">Aucune consultation enregistrée pour cet animal.</p>
        )}

        {!loading && consultations.length > 0 && (
          <ul className="space-y-4">
            {consultations.map((c) => (
              <li
                key={c._id}
                className="p-4 border border-teal-100 rounded-lg bg-teal-50 shadow-sm hover:shadow-md transition duration-200 ease-in-out"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4">
                  <p>
                    <strong>Date :</strong>{" "}
                    <span className="font-medium">
                      {new Date(c.createdAt || c.date).toLocaleDateString("fr-FR")}
                    </span>
                  </p>
                  <p>
                    <strong>Vétérinaire :</strong> {c.vetId?.username || "Inconnu"}
                  </p>
                  <p>
                    <strong>Poids :</strong>{" "}
                    {c.weight ? `${c.weight} kg` : "Non renseigné"}
                  </p>
                  <p>
                    <strong>Température :</strong>{" "}
                    {c.temperature ? `${c.temperature} °C` : "Non renseigné"}
                  </p>
                  <p className="col-span-1 md:col-span-2 lg:col-span-3">
                    <strong>Diagnostic :</strong> {c.diagnosis || "Non renseigné"}
                  </p>
                  <p className="col-span-1 md:col-span-2 lg:col-span-3">
                    <strong>Traitement :</strong> {c.treatment || "Non renseigné"}
                  </p>
                  <p className="col-span-1 md:col-span-2 lg:col-span-3">
                    <strong>Notes :</strong> {c.notes || "Non renseigné"}
                  </p>
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