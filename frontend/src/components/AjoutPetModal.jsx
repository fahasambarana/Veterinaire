import React, { useEffect, useState } from "react";
import axios from "axios";

const AllPetsAdmin = () => {
  const [pets, setPets] = useState([]);
  const [filter, setFilter] = useState(""); // État du filtre

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
  }, []);

  // Filtrer les animaux selon le nom du propriétaire (username)
  const filteredPets = pets.filter((pet) => {
    if (!pet.ownerId?.username) return false;
    return pet.ownerId.username.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-teal-700">Tous les animaux</h2>

      <input
        type="text"
        placeholder="Filtrer par nom de client..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-4 p-2 border rounded w-full max-w-xs"
      />

      <table className="w-full text-left border">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2">Nom</th>
            <th className="p-2">Espèce</th>
            <th className="p-2">Âge</th>
            <th className="p-2">Sexe</th>
            <th className="p-2">Propriétaire</th>
          </tr>
        </thead>
        <tbody>
          {filteredPets.length > 0 ? (
            filteredPets.map((pet) => (
              <tr key={pet._id} className="border-t">
                <td className="p-2">{pet.name}</td>
                <td className="p-2">{pet.species}</td>
                <td className="p-2">{pet.age}</td>
                <td className="p-2">{pet.gender}</td>
                <td className="p-2">{pet.ownerId?.username || "Non défini"}</td>
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
  );
};

export default AllPetsAdmin;
