import React from "react";

const LogoutModal = ({ isOpen, onCancel, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="animate-fade-in-up bg-white p-6 rounded-xl shadow-2xl w-96 max-w-[90%] border border-gray-100">
        <div className="flex flex-col items-center">
          {/* Icône d'alerte */}
          <div className="mb-4 p-3 bg-red-100 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Titre et message */}
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Confirmer la déconnexion</h3>
          <p className="text-gray-600 text-center mb-6">
            Vous êtes sur le point de vous déconnecter de votre compte.
          </p>

          {/* Boutons d'action alignés */}
          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 hover:shadow-md flex items-center justify-center"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 hover:shadow-md shadow-red-200 flex items-center justify-center"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;