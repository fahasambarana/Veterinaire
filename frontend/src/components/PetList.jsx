import React, { useState } from "react";
import { Eye, Edit, Trash2, PlusCircle } from "lucide-react";

const PetList = ({ pets, onViewDetails, onEdit, onDelete, loadingPets, deletingPetId }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [petToDelete, setPetToDelete] = useState(null);

  const handleDeleteClick = (petId) => {
    setPetToDelete(petId);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = () => {
    onDelete(petToDelete);
    setShowConfirmModal(false);
  };

  const handleCancelDelete = () => {
    setPetToDelete(null);
    setShowConfirmModal(false);
  };

  return (
    <div className="overflow-x-auto w-full">
      {/* Modal de confirmation */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="p-3 bg-red-100 rounded-full mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                Confirmer la suppression
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Êtes-vous sûr de vouloir supprimer cet animal ? Cette action est irréversible.
              </p>
              <div className="flex justify-center space-x-4 w-full">
                <button
                  onClick={handleCancelDelete}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all shadow-md"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <table className="min-w-full bg-white border rounded-xl shadow-md">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Nom</th>
            <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Espèce</th>
            <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Âge</th>
            <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Sexe</th>
            <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {loadingPets ? (
            <tr>
              <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                  <span className="ml-3">Chargement des animaux...</span>
                </div>
              </td>
            </tr>
          ) : pets.length === 0 ? (
            <tr>
              <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <PlusCircle className="w-8 h-8 text-gray-400" />
                  <p className="text-lg font-medium">Aucun animal enregistré</p>
                  <p className="text-sm">Ajoutez un animal pour commencer</p>
                </div>
              </td>
            </tr>
          ) : (
            pets.map((pet) => (
              <tr key={pet._id} className="border-t hover:bg-gray-50 transition duration-150 ease-in-out">
                <td className="px-4 py-3 cursor-pointer" onClick={() => onViewDetails(pet)}>{pet.name}</td>
                <td className="px-4 py-3 cursor-pointer" onClick={() => onViewDetails(pet)}>{pet.species}</td>
                <td className="px-4 py-3 cursor-pointer" onClick={() => onViewDetails(pet)}>{pet.age}</td>
                <td className="px-4 py-3 cursor-pointer" onClick={() => onViewDetails(pet)}>{pet.gender}</td>
                <td className="px-4 py-3">
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onViewDetails(pet); }}
                      title="Voir détails"
                      className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 transition duration-150 ease-in-out"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(pet); }}
                      title="Modifier"
                      className="text-yellow-500 hover:text-yellow-600 p-1 rounded-full hover:bg-yellow-100 transition duration-150 ease-in-out"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(pet._id); }}
                      title="Supprimer"
                      className={`text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-red-100 transition duration-150 ease-in-out ${deletingPetId === pet._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={deletingPetId === pet._id}
                    >
                      {deletingPetId === pet._id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PetList;