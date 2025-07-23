import React, { useState, useEffect } from "react";
import axios from "axios";
// On ne va plus importer Lucide-React si AjoutPetModal ne l'utilise pas
// import { X, Loader2 } from "lucide-react"; 

// Définir API_URL ici pour qu'il soit accessible
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const EditPetModal = ({ isOpen, onClose, pet, onPetUpdated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    species: "",
    age: "",
    gender: "Male",
    image: null, // Pour le fichier image sélectionné
    currentImage: null, // Pour stocker le nom de l'image existante si elle est modifiée
  });

  useEffect(() => {
    if (pet) {
      setFormData({
        name: pet.name || "",
        species: pet.species || "",
        age: pet.age || "",
        gender: pet.gender || "Male",
        image: null, // Réinitialiser le champ de fichier à chaque ouverture
        currentImage: pet.image || null, // Garder une trace de l'image actuelle
      });
      setError(null); // Réinitialiser les erreurs à l'ouverture
      setIsLoading(false); // Réinitialiser l'état de chargement
    }
  }, [pet]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setFormData((prev) => ({ ...prev, image: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const dataToSubmit = new FormData();

      dataToSubmit.append("name", formData.name);
      dataToSubmit.append("species", formData.species);
      dataToSubmit.append("age", formData.age);
      dataToSubmit.append("gender", formData.gender);

      if (formData.image instanceof File) {
        dataToSubmit.append("image", formData.image);
      } 
      // Si aucune nouvelle image n'est sélectionnée, l'ancienne est conservée côté backend
      // grâce à la logique de petController.js (pet.image = image)

      await axios.put(`${API_URL}/pets/${pet._id}`, dataToSubmit, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Animal mis à jour avec succès !");
      onPetUpdated();
      onClose();
    } catch (err) {
      console.error("Erreur lors de la mise à jour :", err.response?.data || err.message);
      setError(
        err.response?.data?.message || "Une erreur est survenue lors de la mise à jour de l'animal. Veuillez réessayer."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !pet) return null;

  return (
    // Conteneur de la modale avec un fond sombre semi-transparent (comme AjoutPetModal)
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center transition-opacity duration-300 ease-in-out">
      {/* Contenu de la modale (comme AjoutPetModal) */}
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg transform transition-all duration-300 scale-100">
        {/* Suppression du bouton X de fermeture pour être comme AjoutPetModal */}

        {/* Titre (comme AjoutPetModal) */}
        <h3 className="text-xl font-bold mb-4 text-teal-700">Modifier l’animal</h3>

        {/* Messages d'erreur et de chargement (comme AjoutPetModal) */}
        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}
        {isLoading && (
          <div className="text-center text-teal-600 mb-4">Mise à jour en cours...</div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4"> {/* space-y-4 comme AjoutPetModal */}
          {/* Suppression des labels pour être comme AjoutPetModal, en utilisant des placeholders */}
          <input
            type="text"
            name="name"
            placeholder="Nom"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 focus:ring-teal-500 focus:border-teal-500" // p-2 comme AjoutPetModal
            required
          />
          
          <input
            type="text"
            name="species"
            placeholder="Espèce"
            value={formData.species}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 focus:ring-teal-500 focus:border-teal-500" // p-2 comme AjoutPetModal
            required
          />

          <input
            type="number"
            name="age"
            placeholder="Âge"
            value={formData.age}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 focus:ring-teal-500 focus:border-teal-500" // p-2 comme AjoutPetModal
            required
          />

          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full border rounded-lg p-2 bg-white focus:ring-teal-500 focus:border-teal-500" // p-2 comme AjoutPetModal, bg-white pour select
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
            className="w-full border rounded-lg p-2 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" // p-2 comme AjoutPetModal
          />

          {/* Afficher l'image actuelle si elle existe et si aucune nouvelle image n'est sélectionnée */}
          {formData.currentImage && !formData.image && (
            <div className="mt-2 text-center">
              <p className="text-sm text-gray-600 mb-2">Image actuelle :</p>
              <img
                src={`${API_URL}/uploads/pets/${formData.currentImage}`}
                alt="Image actuelle de l'animal"
                className="max-w-[150px] max-h-[150px] object-cover rounded-lg shadow-md mx-auto border border-gray-200" // Ajusté la taille max
              />
            </div>
          )}
          {/* Si une nouvelle image est sélectionnée, on peut afficher un aperçu */}
          {formData.image && (
            <div className="mt-2 text-center">
              <p className="text-sm text-gray-600 mb-2">Nouvelle image :</p>
              <img
                src={URL.createObjectURL(formData.image)}
                alt="Nouvelle image sélectionnée"
                className="max-w-[150px] max-h-[150px] object-cover rounded-lg shadow-md mx-auto border border-gray-200" // Ajusté la taille max
              />
            </div>
          )}


          <div className="flex justify-end space-x-2"> {/* space-x-2 comme AjoutPetModal, suppression pt-4 border-t */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200" // Comme AjoutPetModal
              disabled={isLoading} // Désactiver le bouton Annuler pendant le chargement
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200" // Comme AjoutPetModal
              disabled={isLoading} // Désactiver le bouton pendant la soumission
            >
              {isLoading ? "Enregistrement..." : "Enregistrer les modifications"} {/* Texte de chargement sans icône */}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPetModal;