import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Si vous utilisez React Router
import socket from '../socket'; // Importe l'instance Socket.IO

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

  if (loading) return <p>Chargement des conversations...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Mes Conversations</h2>
      {conversations.length === 0 ? (
        <p>Vous n'avez pas encore de conversations.</p>
      ) : (
        <ul>
          {conversations.map((conv) => {
            // Déterminer l'autre participant (pas l'utilisateur connecté)
            const otherParticipant = conv.participants.find(
              p => p._id !== JSON.parse(localStorage.getItem('user')).id // Assurez-vous que l'ID utilisateur est bien stocké
            );
            return (
              <li
                key={conv._id}
                className="p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
                onClick={() => onSelectConversation(conv._id)} // Ou navigate(`/chat/${conv._id}`)
              >
                <div>
                  <p className="font-medium text-lg">{otherParticipant?.username || 'Utilisateur inconnu'}</p>
                  <p className="text-sm text-gray-600">
                    {conv.lastMessage ? (
                      `Dernier message: ${conv.lastMessage.content.substring(0, 30)}...`
                    ) : 'Aucun message.'}
                  </p>
                </div>
                <span className="text-xs text-gray-400">
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