import React, { useState } from "react";
import axios from "axios";

const AjoutPetModal = ({ isOpen, onClose, onPetAdded }) => {
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    age: "",
    gender: "Male",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/pets/ajoutPet", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      onPetAdded(); // rafraîchir la liste
      onClose(); // fermer le modal
    } catch (err) {
      console.error("Erreur lors de l'ajout :", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-teal-700">Ajouter un animal</h3>
        <form onSubmit={handleAdd} className="space-y-4">
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
            required
          >
            <option value="Male">Mâle</option>
            <option value="Female">Femelle</option>
          </select>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-gray-700"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AjoutPetModal;
