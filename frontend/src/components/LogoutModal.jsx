import React from "react";

const LogoutModal = ({ isOpen, onCancel, onConfirm }) => {
  if (!isOpen) return null; // Don't render if the modal is not open

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white p-6 rounded-lg shadow-xl w-80">
        <h3 className="text-xl font-bold text-center mb-4">Confirmer la déconnexion</h3>
        <p className="text-center mb-6">Êtes-vous sûr de vouloir vous déconnecter ?</p>
        <div className="flex justify-between">
          <button
            onClick={onCancel} // Call onCancel when clicking Cancel
            className="px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm} // Call onConfirm when confirming logout
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
