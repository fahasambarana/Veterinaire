import React from "react";

const PetDetails = ({ pet, onBack }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border w-full">
      <h2 className="text-2xl font-semibold text-teal-700 mb-4">Détails de l’animal</h2>
      <div className="grid grid-cols-2 gap-4 text-gray-700">
        <p><strong>Nom :</strong> {pet.name}</p>
        <p><strong>Espèce :</strong> {pet.species}</p>
        <p><strong>Âge :</strong> {pet.age} an(s)</p>
        <p><strong>Sexe :</strong> {pet.gender}</p>
        {pet.image && (
          <div className="col-span-2 mt-4">
            <img
              src={pet.image}
              alt={pet.name}
              className="w-full max-h-64 object-cover rounded-lg border"
            />
          </div>
        )}
      </div>
      <div className="mt-6">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
        >
          ← Retour à la liste
        </button>
      </div>
    </div>
  );
};

export default PetDetails;
