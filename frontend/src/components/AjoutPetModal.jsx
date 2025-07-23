import React, { useState } from "react";
import axios from "axios";

const AjoutPetModal = ({ isOpen, onClose, onPetAdded, ownerId }) => {
  const [formData, setFormData] = useState({
    name: "",
    species: "", // Vide initialement pour le select
    otherSpecies: "", // Nouveau champ pour l'option "Autre..."
    age: "",
    gender: "Male",
    image: null,
  });
  const [showOtherSpeciesInput, setShowOtherSpeciesInput] = useState(false); // État pour afficher le champ "Autre..."
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      setFormData((prevData) => ({ ...prevData, image: files[0] }));
    } else if (name === "species") {
      setFormData((prevData) => ({ ...prevData, species: value }));
      if (value === "Autre...") {
        setShowOtherSpeciesInput(true);
      } else {
        setShowOtherSpeciesInput(false);
        // Réinitialiser otherSpecies si une option prédéfinie est choisie
        setFormData((prevData) => ({ ...prevData, otherSpecies: "" }));
      }
    } else if (name === "otherSpecies") { // Gérer le champ de texte "Autre..."
      setFormData((prevData) => ({ ...prevData, otherSpecies: value }));
    } else {
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    // Déterminer la valeur finale de l'espèce à envoyer au backend
    let finalSpecies = formData.species;
    if (formData.species === "Autre...") {
      finalSpecies = formData.otherSpecies;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setFormError("Authentification requise. Veuillez vous connecter.");
        setIsSubmitting(false);
        return;
      }

      // --- Validation côté client ---
      // Vérifier les champs obligatoires (nom, espèce finale, âge, genre)
      if (!formData.name || !finalSpecies || !formData.age || !formData.gender) {
        setFormError("Veuillez remplir tous les champs obligatoires.");
        setIsSubmitting(false);
        return;
      }

      // Validation de l'âge
      if (isNaN(parseInt(formData.age)) || parseInt(formData.age) < 0) {
        setFormError("L'âge doit être un nombre positif.");
        setIsSubmitting(false);
        return;
      }

      // Validation spécifique pour l'option "Autre..."
      if (showOtherSpeciesInput && !formData.otherSpecies.trim()) {
        setFormError("Veuillez spécifier le type d'animal si 'Autre...' est sélectionné.");
        setIsSubmitting(false);
        return;
      }
      // --- Fin de la validation côté client ---

      const data = new FormData();

      data.append("name", formData.name);
      data.append("species", finalSpecies); // Envoyer la valeur finale de l'espèce
      data.append("age", parseInt(formData.age));
      data.append("gender", formData.gender);
      data.append("ownerId", ownerId);
      if (formData.image) data.append("image", formData.image);

      await axios.post("http://localhost:5000/api/pets/ajoutPet", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      onPetAdded();
      onClose();
      // Réinitialiser le formulaire après succès
      setFormData({ name: "", species: "", otherSpecies: "", age: "", gender: "Male", image: null });
      setShowOtherSpeciesInput(false); // Cacher le champ "Autre..."
    } catch (err) {
      console.error("Erreur lors de l'ajout de l'animal :", err);
      setFormError(
        err.response?.data?.message || "Une erreur est survenue lors de l'ajout de l'animal. Veuillez réessayer."
      );
    } finally {
      setIsSubmitting(false);
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
            className="w-full border rounded-lg p-2 focus:ring-teal-500 focus:border-teal-500"
            required
          />

          {/* Sélecteur pour l'espèce */}
          <select
            name="species"
            value={formData.species}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 focus:ring-teal-500 focus:border-teal-500"
            required
          >
            <option value="">-- Sélectionnez une espèce --</option> {/* Option par défaut */}
            <option value="Chien">Chien</option>
            <option value="Chat">Chat</option>
            <option value="Lapin">Lapin</option>
            <option value="Cochon">Cochon</option>
            <option value="Coq">Coq</option>
            <option value="Poule">Poule</option>
            <option value="Autre...">Autre...</option>
          </select>

          {/* Champ de texte conditionnel pour "Autre..." */}
          {showOtherSpeciesInput && (
            <input
              type="text"
              name="otherSpecies" // Nom distinct pour ce champ
              placeholder="Spécifiez le type d'animal (ex: Furet)"
              value={formData.otherSpecies}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 focus:ring-teal-500 focus:border-teal-500"
              required // Ce champ est obligatoire s'il est affiché
            />
          )}

          <input
            type="number"
            name="age"
            placeholder="Âge"
            value={formData.age}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 focus:ring-teal-500 focus:border-teal-500"
            min="0"
            required
          />
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 focus:ring-teal-500 focus:border-teal-500"
            required
          >
            <option value="Male">Mâle</option>
            <option value="Female">Femelle</option>
          </select>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
            className="w-full border rounded-lg p-2 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
          />

          {formError && (
            <p className="text-red-500 text-sm">{formError}</p>
          )}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Ajout en cours..." : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AjoutPetModal;