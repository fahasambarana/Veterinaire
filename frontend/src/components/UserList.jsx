// frontend/src/components/UserList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, PlusCircle, Loader2 } from 'lucide-react';

// Assurez-vous que les URL de base correspondent à votre configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const BASE_URL = API_URL.replace(/\/api\/?$/, ""); // => http://localhost:5000

const Spinner = () => (
    <div className="flex justify-center items-center h-full py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
    </div>
);

// Fonction utilitaire pour obtenir le nom d'affichage du rôle
const getRoleDisplayName = (role) => {
    switch(role) {
      case 'propriétaire d\'animal':
        return 'Propriétaire d\'animal';
      case 'vet':
      case 'veterinaire':
        return 'Vétérinaire';
      case 'admin':
        return 'Administrateur';
      default:
        return 'Utilisateur';
    }
};

const UserList = ({ onSelectUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const fetchUsers = useCallback(async (term) => {
    try {
      setLoading(true);
      setError(null);
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
        params: {
          search: term
        }
      };

      const res = await axios.get(`${API_URL}/api/users/chat-eligible`, config);
      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors de la récupération des utilisateurs:', err);
      setError('Impossible de charger la liste des utilisateurs.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
        fetchUsers(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchUsers]);

  const handleStartConversation = (userId) => {
    if (onSelectUser) {
        onSelectUser(userId);
    } else {
        navigate(`/chat?userId=${userId}`);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <div className="p-4 bg-white shadow rounded-lg max-w-sm mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">Démarrer une conversation</h2>
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher un utilisateur..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition-colors"
        />
      </div>
      {users.length === 0 ? (
        <p className="text-gray-500 text-lg text-center">Aucun utilisateur trouvé.</p>
      ) : (
        <ul className="max-h-[400px] overflow-y-auto custom-scrollbar divide-y divide-gray-200">
          {users.map((user) => {
            const profilePicturePath = user.profilePicture?.replace(/^\/+/, "");
            const profileImageUrl = profilePicturePath
              ? `${BASE_URL}/${profilePicturePath}`
              : "https://placehold.co/48x48/E0F2F7/0D9488?text=User";

            return (
              <li
                key={user._id}
                className="py-3 px-2 flex items-center space-x-3 cursor-pointer hover:bg-gray-50 transition duration-150 rounded-md"
                onClick={() => handleStartConversation(user._id)}
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden border border-gray-100">
                  <img
                    src={profileImageUrl}
                    alt={user.username || "Utilisateur"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/48x48/E0F2F7/0D9488?text=User";
                      e.target.classList.add("p-2", "object-contain");
                    }}
                  />
                </div>
                <div className="flex-grow">
                  <p className="font-medium text-lg text-gray-800">
                    {user.username} 
                    {user.role && ` (${getRoleDisplayName(user.role)})`}
                  </p>
                </div>
                <PlusCircle className="w-6 h-6 text-teal-600 flex-shrink-0 hover:text-teal-700 transition duration-150" />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default UserList;
