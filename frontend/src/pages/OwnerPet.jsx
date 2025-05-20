// pages/OwnerPet.jsx
import React, { useEffect, useState } from "react";
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
  };

  const handleDelete = async (petId) => {
    const token = localStorage.getItem("token");
    if (window.confirm("Confirmer la suppression ?")) {
      try {
        await axios.delete(`http://localhost:5000/api/pets/delete/${petId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchPets();
      } catch (err) {
        console.error("Erreur de suppression :", err);
      }
    }
  };
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [petToEdit, setPetToEdit] = useState(null);

  const handleEdit = (pet) => {
    // À implémenter plus tard (ex: modal d’édition)
    setPetToEdit(pet);
    setIsEditModalOpen(true);
    console.log("Éditer :", pet);
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
          {!selectedPet ? (
            <>
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
                onPetUpdated={fetchPets}
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
