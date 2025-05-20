import React from "react";
import { Eye, Edit, Trash2 } from "lucide-react";

const PetList = ({ pets, onViewDetails, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full bg-white border rounded-xl shadow-md">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-4 py-3 text-left">Nom</th>
            <th className="px-4 py-3 text-left">Espèce</th>
            <th className="px-4 py-3 text-left">Âge</th>
            <th className="px-4 py-3 text-left">Sexe</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {pets.map((pet) => (
            <tr key={pet._id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">{pet.name}</td>
              <td className="px-4 py-2">{pet.species}</td>
              <td className="px-4 py-2">{pet.age}</td>
              <td className="px-4 py-2">{pet.gender}</td>
              <td className="px-4 py-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onViewDetails(pet)}
                    title="Voir détails"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onEdit(pet)}
                    title="Modifier"
                    className="text-yellow-500 hover:text-yellow-600"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(pet._id)}
                    title="Supprimer"
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {pets.length === 0 && (
            <tr>
              <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                Aucun animal enregistré.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PetList;
