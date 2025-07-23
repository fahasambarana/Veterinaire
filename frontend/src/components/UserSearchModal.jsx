// frontend/src/components/UserSearchModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader2 } from 'lucide-react'; // Importez des icônes

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'; // Assurez-vous que c'est bien votre URL de base

const UserSearchModal = ({ isOpen, onClose, onUserSelect }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) {
      // Réinitialiser l'état quand la modale est fermée
      setUsers([]);
      setSearchTerm('');
      setError(null);
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // Nouvelle route backend pour récupérer les utilisateurs éligibles au chat (par exemple, les vétérinaires)
        // Adaptez l'URL et le paramètre 'role' selon votre logique backend si vous voulez filtrer
        const res = await axios.get(`${API_URL}/api/users/chat-eligible?search=${searchTerm}`, config);
        
        // Filtrer l'utilisateur courant de la liste (au cas où le backend ne le ferait pas)
        const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;
        const filteredUsers = res.data.filter(user => user._id !== currentUserId);
        
        setUsers(filteredUsers);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération des utilisateurs:', err);
        setError(`Impossible de charger les utilisateurs : ${err.response?.data?.message || err.message}`);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, searchTerm]); // Recharger quand la modale s'ouvre ou le terme de recherche change

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all duration-300 scale-100 relative border border-gray-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors duration-200"
          aria-label="Fermer la modale"
        >
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-3xl font-extrabold mb-6 text-teal-700 text-center">Démarrer une Nouvelle Conversation</h3>
        
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-teal-500 focus:border-teal-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="h-64 overflow-y-auto border border-gray-200 rounded-lg p-2">
          {loading && (
            <div className="flex items-center justify-center gap-2 text-teal-600">
              <Loader2 className="animate-spin w-5 h-5" />
              <span>Chargement des utilisateurs...</span>
            </div>
          )}
          {error && <p className="text-red-500 text-center">{error}</p>}
          {!loading && !error && users.length === 0 && <p className="text-gray-500 text-center">Aucun utilisateur trouvé.</p>}
          <ul>
            {!loading && !error && users.map(user => (
              <li
                key={user._id}
                className="p-3 border-b border-gray-200 last:border-b-0 cursor-pointer hover:bg-gray-100 rounded-md flex items-center justify-between"
                onClick={() => onUserSelect(user._id)}
              >
                <span className="font-medium">{user.username}</span>
                <span className="text-sm text-gray-500">({user.role})</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSearchModal;