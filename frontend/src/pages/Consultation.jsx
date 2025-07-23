// frontend/src/pages/ChatPage.jsx

import React, { useState, useEffect } from 'react';
import LayoutSidebar from '../components/LayoutSidebar'; // Importez votre LayoutSidebar
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import { useAuth } from '../context/AuthContext'; // Utilisez useAuth pour l'ID utilisateur

const ChatPage = () => {
  const { user } = useAuth(); // Récupère l'utilisateur depuis le AuthContext
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    // Si l'utilisateur est chargé et disponible via le contexte, mettez à jour currentUserId
    if (user && user.id) {
      setCurrentUserId(user.id);
    }
  }, [user]); // Dépend de l'objet user du contexte

  const handleSelectConversation = (conversationId) => {
    setSelectedConversationId(conversationId);
  };

  // Optionnel: Afficher un message de chargement ou de non-connexion si l'utilisateur n'est pas disponible
  if (!user && !currentUserId) {
    return (
      <LayoutSidebar>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-gray-100 p-4">
          <p className="text-xl font-semibold text-gray-700">Veuillez vous connecter pour accéder au chat.</p>
          {/* Vous pouvez ajouter un bouton de redirection vers la page de login ici */}
        </div>
      </LayoutSidebar>
    );
  }

  return (
    <LayoutSidebar>
      {/* L'en-tête et le style centralisé de Consultation.jsx sont adaptés ici
          pour une mise en page de chat côte à côte */}
      <div className="flex flex-col h-full bg-gray-100 p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Messages
        </h1>
        
        <div className="flex flex-1 rounded-lg shadow-lg overflow-hidden bg-white">
          {/* Panneau de la liste des conversations */}
          <div className="w-1/3 border-r border-gray-200 p-4 overflow-y-auto">
            <ConversationList onSelectConversation={handleSelectConversation} />
          </div>

          {/* Fenêtre de chat */}
          <div className="w-2/3 flex flex-col">
            {currentUserId ? ( // S'assurer que currentUserId est disponible avant de rendre ChatWindow
              <ChatWindow
                conversationId={selectedConversationId}
                currentUserId={currentUserId}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Chargement de votre profil...
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutSidebar>
  );
};

export default ChatPage;