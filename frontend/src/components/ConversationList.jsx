// frontend/src/components/ConversationList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import socket from '../socket'; // Importe l'instance Socket.IO
import { User as UserIcon } from 'lucide-react'; // Import User icon for placeholder

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// Base URL for profile pictures, assuming they are served from /uploads/profile on your backend
const BASE_URL = API_URL.replace(/\/api\/?$/, ""); // => http://localhost:5000


const ConversationList = ({ onSelectConversation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Pour la navigation

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentification requise.');
          setLoading(false);
          return;
        }
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        const res = await axios.get(`${API_URL}/api/conversations/mine`, config);
        setConversations(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération des conversations:', err);
        setError('Impossible de charger les conversations.');
        setLoading(false);
      }
    };

    fetchConversations();

    // Écoute les mises à jour de conversation (par exemple, nouveau dernier message)
    // C'est un exemple basique, une gestion plus robuste serait nécessaire pour des mises à jour complexes
    const handleConversationUpdate = (updatedConversation) => {
      setConversations(prev => {
        const index = prev.findIndex(conv => conv._id === updatedConversation._id);
        if (index !== -1) {
          // Si la conversation existe, la met à jour et la déplace en haut
          const newConversations = [...prev];
          newConversations[index] = updatedConversation;
          return newConversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        } else {
          // Si c'est une nouvelle conversation, l'ajoute
          return [updatedConversation, ...prev];
        }
      });
    };

    socket.on('conversationUpdated', handleConversationUpdate);

    return () => {
      socket.off('conversationUpdated', handleConversationUpdate);
    };
  }, []);

  // Définir la logique du spinner
  const Spinner = () => (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
    </div>
  );

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <div className="p-4 bg-white shadow rounded-lg max-w-sm mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Mes Conversations</h2>
      {conversations.length === 0 ? (
        <p className="text-gray-500 text-lg text-center">Vous n'avez pas encore de conversations.</p>
      ) : (
        // Utilisation d'une hauteur maximale avec un défilement automatique
        <ul className="max-h-[500px] overflow-y-auto custom-scrollbar">
          {conversations.map((conv) => {
            // Déterminer l'autre participant (pas l'utilisateur connecté)
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const otherParticipant = conv.participants.find(
              p => p._id !== currentUser.id
            );

            // Construct full image URL with fallback
            const profilePicturePath = otherParticipant?.profilePicture?.replace(/^\/+/, "");
            const profileImageUrl = profilePicturePath
              ? `${BASE_URL}/${profilePicturePath}`
              : "https://placehold.co/48x48/E0F2F7/0D9488?text=User";

            return (
              <li
                key={conv._id}
                className="p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition duration-150 flex items-center space-x-4 last:border-b-0 rounded-md"
                onClick={() => onSelectConversation(conv._id)}
              >
                {/* Profile Picture/Icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden border border-gray-100">
                  <img
                    src={profileImageUrl}
                    alt={otherParticipant?.username || "Utilisateur"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/48x48/E0F2F7/0D9488?text=User";
                      e.target.classList.add("p-2", "object-contain");
                    }}
                  />
                </div>

                <div className="flex-grow">
                  <p className="font-medium text-lg text-gray-800">{otherParticipant?.username || 'Utilisateur inconnu'}</p>
                  <p className="text-sm text-gray-600">
                    {conv.lastMessage ? (
                      `Dernier message: ${conv.lastMessage.content.substring(0, 30)}${conv.lastMessage.content.length > 30 ? '...' : ''}`
                    ) : 'Aucun message.'}
                  </p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString() : ''}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ConversationList;
