import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/LayoutSidebar";
import { useAuth } from "../context/AuthContext";

const AllPetsAdmin = () => {
  const [pets, setPets] = useState([]);
  const [filter, setFilter] = useState("");

  const { user } = useAuth();
  useEffect(() => {
    const fetchPets = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/pets/all", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPets(res.data);
      } catch (err) {
        console.error("Erreur chargement animaux :", err.message);
      }
    };

    fetchPets();
  }, [user]);

  const filteredPets = pets.filter((pet) => {
    if (!pet.ownerId?.username) return false;
    return pet.ownerId.username.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <Layout>
      { user?.role === "admin" && (
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-4 text-center">
                      Aucun animal trouvé pour ce client.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  
  );
};

export default AllPetsAdmin;
