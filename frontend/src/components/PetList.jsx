import React from "react";
import { Eye, Edit, Trash2, PlusCircle } from "lucide-react"; // Added PlusCircle for empty state

const PetList = ({ pets, onViewDetails, onEdit, onDelete, loadingPets, deletingPetId }) => {
  return (
    <div className="overflow-x-auto w-full">
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
                  <p className="text-lg font-medium">Aucun animal enregistré pour le moment.</p>
                  <p className="text-sm">Cliquez sur "Ajouter un animal" pour commencer.</p>
                </div>
              </td>
            </tr>
          ) : (
            pets.map((pet) => (
              <tr key={pet._id} className="border-t hover:bg-gray-50 transition duration-150 ease-in-out">
                {/* Make the entire row clickable for details, except for action buttons */}
                <td className="px-4 py-3 cursor-pointer" onClick={() => onViewDetails(pet)}>{pet.name}</td>
                <td className="px-4 py-3 cursor-pointer" onClick={() => onViewDetails(pet)}>{pet.species}</td>
                <td className="px-4 py-3 cursor-pointer" onClick={() => onViewDetails(pet)}>{pet.age}</td>
                <td className="px-4 py-3 cursor-pointer" onClick={() => onViewDetails(pet)}>{pet.gender}</td>
                <td className="px-4 py-3">
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onViewDetails(pet); }} // Stop propagation to prevent row click
                      title="Voir détails"
                      className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(pet); }} // Stop propagation
                      title="Modifier"
                      className="text-yellow-500 hover:text-yellow-600 p-1 rounded-full hover:bg-yellow-100 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(pet._id); }} // Stop propagation
                      title="Supprimer"
                      className={`text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-red-100 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 ${deletingPetId === pet._id ? 'opacity-50 cursor-not-allowed' : ''}`}
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