import React, { useState, useEffect } from "react";
import axios from "axios";

const EditPetModal = ({ isOpen, onClose, pet, onPetUpdated }) => {
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    age: "",
    gender: "Male",
  });

  useEffect(() => {
    if (pet) {
      setFormData({
        name: pet.name || "",
        species: pet.species || "",
        age: pet.age || "",
        gender: pet.gender || "Male",
      });
    }
  }, [pet]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5000/api/pets/update/${pet._id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      onPetUpdated(); // pour rafraîchir la liste
      onClose(); // fermer le modal
    } catch (err) {
      console.error("Erreur lors de la mise à jour :", err);
    }
  };

  if (!isOpen || !pet) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl transform transition-all duration-300 scale-100">
        <h3 className="text-xl font-bold mb-4 text-indigo-700">Modifier l’animal</h3>
        <form onSubmit={handleUpdate} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Nom"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
            required
          />
          <input
            type="text"
            name="species"
            placeholder="Espèce"
            value={formData.species}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
            required
          />
          <input
            type="number"
            name="age"
            placeholder="Âge"
            value={formData.age}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
            required
          />
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          >
            <option value="Male">Mâle</option>
            <option value="Female">Femelle</option>
          </select>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-gray-600"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPetModal;
