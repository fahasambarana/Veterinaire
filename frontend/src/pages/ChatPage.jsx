// frontend/src/pages/ChatPage.jsx
import React, { useState, useEffect } from "react";
import ConversationList from "../components/ConversationList";
import ChatWindow from "../components/ChatWindow";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import { useAuth } from "../context/AuthContext";
import UserSearchModal from '../components/UserSearchModal';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ChatPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isUserSearchModalOpen, setIsUserSearchModalOpen] = useState(false);

  useEffect(() => {
    if (user && user.id) {
      setCurrentUserId(user.id);
    }
  }, [user]);

  const handleSelectConversation = (conversationId) => {
    setSelectedConversationId(conversationId);
  };

  const handleStartNewChat = () => {
    setIsUserSearchModalOpen(true);
  };

  const handleUserSelectedForNewChat = async (recipientId) => {
    setIsUserSearchModalOpen(false);
    await createNewConversation(recipientId);
  };

  const createNewConversation = async (recipientId) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post(`${API_URL}/api/conversations`, { recipientId }, config);
      setSelectedConversationId(res.data._id);
    } catch (error) {
      console.error("Erreur lors de la création/récupération de la conversation:", error);
      alert(`Erreur: ${error.response?.data?.message || error.message}`);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl font-semibold text-gray-700">Chargement de l'authentification...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl font-semibold text-gray-700">Veuillez vous connecter pour accéder au chat.</p>
      </div>
    );
  }

  // Déterminez si la sidebar doit être visible
  const showSidebar = user?.role === "admin" || user?.role === "vet";

  return (
    <div className="min-h-screen flex bg-gray-100">

      {/* Barre latérale pour les rôles 'admin' ou 'vet' */}
      {showSidebar && (
        <Sidebar brand="PetCare" />
      )}

      {/* Contenu principal de la page, avec marge à gauche si la sidebar est présente */}
      <div className={`flex-1 flex flex-col ${showSidebar ? 'ml-64' : ''}`}>
        {/* Barre de navigation pour le rôle 'pet-owner' */}
        {user?.role === "pet-owner" && (
          <Navbar />
        )}

        {/* Contenu du chat, ajusté si une Navbar est présente */}
        <div className={`flex flex-col flex-1 p-4 sm:p-6 lg:p-8 ${user?.role === "pet-owner" ? 'pt-20' : ''}`}>
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Messages
          </h1>
          <div className="flex flex-1 rounded-lg shadow-lg overflow-hidden bg-white">
            <div className="w-1/3 border-r border-gray-200 p-4 overflow-y-auto">
              <button
                onClick={handleStartNewChat}
                className="mb-4 w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition duration-200"
              >
                Démarrer une nouvelle conversation
              </button>
              <ConversationList onSelectConversation={handleSelectConversation} />
            </div>

            <div className="w-2/3 flex flex-col">
              {currentUserId ? (
                <ChatWindow
                  conversationId={selectedConversationId}
                  currentUserId={currentUserId}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Chargement de votre profil utilisateur...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <UserSearchModal
        isOpen={isUserSearchModalOpen}
        onClose={() => setIsUserSearchModalOpen(false)}
        onUserSelect={handleUserSelectedForNewChat}
      />
    </div>
  );
};

export default ChatPage;