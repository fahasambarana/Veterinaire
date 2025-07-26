// src/components/AllPetsAdmin.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/LayoutSidebar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Search, History, PawPrint, User, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AllPetsAdmin = () => {
  const [pets, setPets] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPets = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentification requise. Veuillez vous connecter.");
          setLoading(false);
          return;
        }

        const res = await axios.get(`${API_URL}/pets/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Sort pets by creation date in descending order (most recent first)
        // Assuming 'createdAt' field exists in your pet objects from the API
        // If 'createdAt' is not available, you might need to use another date field
        // or ensure your backend provides it.
        const sortedPets = res.data.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0); // Use 0 for fallback to handle missing dates
          const dateB = new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime(); // Sort descending
        });

        setPets(sortedPets);
      } catch (err) {
        console.error("Erreur chargement animaux :", err);
        setError(
          err.response?.data?.message || "Erreur lors du chargement des animaux."
        );
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user && (user.role === "admin" || user.role === "vet")) {
      fetchPets();
    }
  }, [user, authLoading]); // API_URL is a constant, no need in dependency array

  const filteredPets = pets.filter((pet) => {
    const ownerUsername = pet.ownerId?.username || "";
    const petName = pet.name || "";
    const species = pet.species || "";
    const gender = pet.gender || "";
    const age = pet.age ? String(pet.age) : "";

    return (
      ownerUsername.toLowerCase().includes(filter.toLowerCase()) ||
      petName.toLowerCase().includes(filter.toLowerCase()) ||
      species.toLowerCase().includes(filter.toLowerCase()) ||
      gender.toLowerCase().includes(filter.toLowerCase()) ||
      age.includes(filter)
    );
  });

  const handleViewMedicalHistory = (petId, petName) => {
    navigate(`/consultationList/${petId}`, { state: { petName } });
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
          <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
          <p className="ml-3 text-lg text-gray-600">Chargement de l'utilisateur...</p>
        </div>
      </Layout>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "vet")) {
    return (
      <Layout>
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg text-center text-red-600 mx-auto mt-20 border border-red-200">
          <h3 className="text-2xl font-bold mb-4">Accès Refusé</h3>
          <p>Vous n'êtes pas autorisé à accéder à cette page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen p-8 bg-gray-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 mx-auto border border-gray-200">
          <h2 className="text-3xl font-extrabold mb-8 text-teal-700 text-center">
            Gestion des Animaux
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6 shadow-md" role="alert">
              <strong className="font-bold">Erreur :</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          <div className="flex items-center mb-8 relative max-w-lg mx-auto">
            <input
              type="text"
              placeholder="Filtrer par nom, espèce, sexe, âge ou propriétaire..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-4 py-3 border border-gray-300 rounded-full w-full focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200 shadow-sm text-gray-700"
            />
            <Search className="absolute left-3 text-gray-400 w-5 h-5" />
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <p className="ml-3 text-lg text-gray-600">Chargement des animaux...</p>
            </div>
          ) : filteredPets.length === 0 ? (
            <p className="text-center text-gray-500 py-10 text-lg italic">Aucun animal trouvé correspondant à votre recherche.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md animate-fade-in">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Espèce</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Âge</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sexe</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Propriétaire</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredPets.map((pet) => (
                    <tr key={pet._id} className="hover:bg-teal-50 transition-colors duration-150 ease-in-out">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                        <PawPrint className="w-4 h-4 mr-2 text-teal-500" />
                        {pet.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pet.species}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pet.age || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pet.gender || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 flex items-center">
                        <User className="w-4 h-4 mr-2 text-blue-500" />
                        {pet.ownerId?.username || "Non défini"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleViewMedicalHistory(pet._id, pet.name)}
                          className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-full text-sm font-medium transition duration-200 transform hover:scale-105 shadow-md"
                        >
                          <History className="w-4 h-4 mr-2" />
                          Historique Médical
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
    </Layout>
  );
};

export default AllPetsAdmin;