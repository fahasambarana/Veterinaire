// pages/OwnerPet.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import AddPetModal from "../components/AjoutPetModal";
import PetList from "../components/PetList";
import PetDetails from "../components/PetDetails";
import Layout from "../components/LayoutNavbar";
import EditPetModal from "../components/EditPetModal";

const OwnerPet = () => {
  const [pets, setPets] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [petToEdit, setPetToEdit] = useState(null);

  // Nouveaux états pour le message de succès
  const [successMessage, setSuccessMessage] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Fonction utilitaire pour afficher un message temporaire
  const showTimedMessage = (message) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
      setSuccessMessage(null);
    }, 2000); // Le message disparaîtra après 2 secondes
  };

  // Fetch pets from API
  const fetchPets = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://localhost:5000/api/pets/mine", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPets(res.data);
    } catch (error) {
      console.error(
        "Erreur de récupération :",
        error.response?.data || error.message
      );
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const handleNewPet = () => {
    fetchPets(); // recharger la liste après ajout
    showTimedMessage("Animal ajouté avec succès !"); // Message après l'ajout
  };

  const handleDelete = async (petId) => {
    const token = localStorage.getItem("token");
    if (window.confirm("Confirmer la suppression ?")) {
      try {
        // CORRECTION DE L'URL DE SUPPRESSION COMME VU PRÉCÉDEMMENT
        await axios.delete(`http://localhost:5000/api/pets/${petId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchPets();
        showTimedMessage("Animal supprimé avec succès !"); // Message après la suppression
      } catch (err) {
        console.error("Erreur de suppression :", err);
        // Optionnel : afficher un message d'erreur si la suppression échoue
        // showTimedMessage("Erreur lors de la suppression de l'animal.");
      }
    }
  };

  const handleEdit = (pet) => {
    setPetToEdit(pet);
    setIsEditModalOpen(true);
  };

  // Nouveau gestionnaire pour la mise à jour de l'animal depuis la modale d'édition
  const handlePetUpdated = () => {
    fetchPets(); // Recharger la liste après la modification
    setIsEditModalOpen(false); // Fermer la modale
    showTimedMessage("Animal modifié avec succès !"); // Message après la modification
  };

  const handleViewDetails = (pet) => {
    setSelectedPet(pet);
  };

  const handleBackToList = () => {
    setSelectedPet(null);
  };

    return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-5xl mx-auto">
          {/* MESSAGE DE SUCCÈS STYLISÉ */}
          {showSuccessMessage && successMessage && (
            <div
              className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50
                         bg-green-100 border border-green-400 text-green-700
                         px-6 py-3 rounded-lg shadow-xl animate-fade-in-down
                         flex items-center justify-between min-w-[300px]" // Ajout de min-w pour une meilleure taille
              role="alert"
            >
              <span className="font-semibold text-lg">{successMessage}</span>
              <button
                onClick={() => setShowSuccessMessage(false)} // Permet de fermer manuellement
                className="ml-4 text-green-700 hover:text-green-900 focus:outline-none"
              >
                &times; {/* Symbole "x" pour fermer */}
              </button>
            </div>
          )}

          {!selectedPet ? (
            <>
              {/* ... (le reste de votre JSX existant pour la liste des animaux) ... */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Mes Animaux
                </h2>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
                >
                  + Ajouter
                </button>
              </div>

              <PetList
                pets={pets}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />

              <AddPetModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onPetAdded={handleNewPet}
              />
              <EditPetModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                pet={petToEdit}
                onPetUpdated={handlePetUpdated}
              />
            </>
          ) : (
            <PetDetails pet={selectedPet} onBack={handleBackToList} />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default OwnerPet;