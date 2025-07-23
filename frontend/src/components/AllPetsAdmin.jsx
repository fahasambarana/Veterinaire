// src/components/AllPetsAdmin.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/LayoutSidebar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const AllPetsAdmin = () => {
  const [pets, setPets] = useState([]);
  const [filter, setFilter] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const token = localStorage.getItem("token");
        // Assurez-vous que le token est présent avant d'envoyer la requête
        if (!token) {
          console.error("Erreur chargement animaux : Token d'authentification manquant.");
          // Optionnel: Rediriger vers la page de connexion si le token est manquant
          // navigate('/login');
          return;
        }

        const res = await axios.get("http://localhost:5000/api/pets/all", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPets(res.data);
      } catch (err) {
        console.error("Erreur chargement animaux :", err); // Log l'objet d'erreur complet
        if (err.response) {
          // L'erreur provient d'une réponse du serveur (status code 4xx ou 5xx)
          console.error("Détails de l'erreur (data) :", err.response.data);
          console.error("Statut de l'erreur (status) :", err.response.status);
          console.error("En-têtes de l'erreur (headers) :", err.response.headers);
        } else if (err.request) {
          // La requête a été faite mais aucune réponse n'a été reçue (ex: réseau down)
          console.error("La requête a été faite mais aucune réponse n'a été reçue :", err.request);
        } else {
          // Quelque chose s'est passé lors de la configuration de la requête qui a déclenché une erreur
          console.error("Erreur lors de la configuration de la requête :", err.message);
        }
      }
    };

    if (user) {
        fetchPets();
    }
  }, [user]);

  const filteredPets = pets.filter((pet) => {
    if (!pet.ownerId || !pet.ownerId.username) return false;
    return pet.ownerId.username.toLowerCase().includes(filter.toLowerCase());
  });

  const handleViewMedicalHistory = (petId, petName) => {
    navigate(`/consultationList/${petId}`, { state: { petName } });
  };

  return (
    <Layout>
      { (user?.role === "admin" || user?.role === "vet") ? (
        <div className="bg-white rounded-xl shadow-md p-6 mx-[10px] flex-grow overflow-auto max-h-screen">
          <h2 className="text-2xl font-bold mb-4 text-teal-700">
            Tous les animaux
          </h2>

          <input
            type="text"
            placeholder="Filtrer par nom de client..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mb-4 p-2 border rounded w-full max-w-xs"
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left border border-gray-300">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 border border-gray-300">Nom</th>
                  <th className="p-2 border border-gray-300">Espèce</th>
                  <th className="p-2 border border-gray-300">Âge</th>
                  <th className="p-2 border border-gray-300">Sexe</th>
                  <th className="p-2 border border-gray-300">Propriétaire</th>
                  <th className="p-2 border border-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPets.length > 0 ? (
                  filteredPets.map((pet) => (
                    <tr key={pet._id} className="border-t border-gray-300">
                      <td className="p-2 border border-gray-300">{pet.name}</td>
                      <td className="p-2 border border-gray-300">
                        {pet.species}
                      </td>
                      <td className="p-2 border border-gray-300">{pet.age}</td>
                      <td className="p-2 border border-gray-300">
                        {pet.gender}
                      </td>
                      <td className="p-2 border border-gray-300">
                        {pet.ownerId?.username || "Non défini"}
                      </td>
                      <td className="p-2 border border-gray-300">
                        <button
                          onClick={() => handleViewMedicalHistory(pet._id, pet.name)}
                          className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                        >
                          Historique Médical
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-4 text-center">
                      Aucun animal trouvé pour ce client.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded shadow-md w-full max-w-lg text-center text-red-600 mx-auto mt-8">
            Vous n'êtes pas autorisé à accéder à cette page.
        </div>
      )}
    </Layout>
  );
};

export default AllPetsAdmin;