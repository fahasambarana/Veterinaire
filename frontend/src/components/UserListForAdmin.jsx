import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { User, Mail, ShieldCheck, XCircle, Loader2, Trash2, ArrowLeft, CheckCircle, Search } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const IMAGE_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace("/api", "")}`
  : 'http://localhost:5000';

const Spinner = () => (
  <div className="flex justify-center items-center h-full py-20">
    <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
  </div>
);

const getRoleDisplayName = (role) => {
  const roles = {
    'pet-owner': 'Propriétaire',
    'vet': 'Vétérinaire',
    'admin': 'Administrateur'
  };
  return roles[role] || 'Utilisateur';
};

const UserProfileDetails = ({ user, onBack, onDelete }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white">
        <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            className="flex items-center text-teal-100 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Retour
          </button>
          <button
            onClick={() => onDelete(user)}
            className="flex items-center bg-white text-red-600 px-4 py-2 rounded-lg shadow hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-5 h-5 mr-2" /> Supprimer
          </button>
        </div>
        
        <div className="flex flex-col items-center mt-4">
          {user.profilePicture ? (
            <img
              src={`${IMAGE_BASE_URL}${user.profilePicture}`}
              alt={`${user.username}`}
              className="w-32 h-32 object-cover rounded-full border-4 border-white shadow-xl"
            />
          ) : (
            <div className="w-32 h-32 flex items-center justify-center bg-white/20 rounded-full border-4 border-white shadow-xl">
              <User className="w-16 h-16 text-white" />
            </div>
          )}
          <h3 className="text-3xl font-bold mt-4">{user.username}</h3>
          <div className="bg-white/20 px-4 py-1 rounded-full mt-2 text-sm font-medium">
            {getRoleDisplayName(user.role)}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-gray-50 p-4 rounded-xl">
          <div className="flex items-center text-gray-700 mb-2">
            <Mail className="w-5 h-5 text-teal-600 mr-3" />
            <span className="font-medium">Email</span>
          </div>
          <p className="text-gray-900 pl-8">{user.email}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl">
          <div className="flex items-center text-gray-700 mb-2">
            <ShieldCheck className="w-5 h-5 text-teal-600 mr-3" />
            <span className="font-medium">Rôle</span>
          </div>
          <p className="text-gray-900 pl-8 capitalize">{getRoleDisplayName(user.role)}</p>
        </div>
      </div>
    </div>
  );
};

const UserCard = ({ user, onSelect, onDelete }) => {
  return (
    <div 
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={() => onSelect(user)}
    >
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-teal-400 to-teal-500 flex items-center justify-center">
          {user.profilePicture ? (
            <img
              src={`${IMAGE_BASE_URL}${user.profilePicture}`}
              alt={`${user.username}`}
              className="w-20 h-20 object-cover rounded-full border-4 border-white shadow-md"
            />
          ) : (
            <div className="w-20 h-20 flex items-center justify-center bg-white/20 rounded-full border-4 border-white shadow-md">
              <User className="w-10 h-10 text-white" />
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(user);
          }}
          className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow hover:bg-red-100 text-red-500 transition-colors"
          aria-label="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-800 mb-1 truncate">{user.username}</h3>
        <div className="flex items-center text-gray-600 mb-2">
          <Mail className="w-4 h-4 mr-2 text-teal-500" />
          <span className="text-sm truncate">{user.email}</span>
        </div>
        <div className="flex items-center">
          <span className={`px-2 py-1 text-xs rounded-full ${
            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
            user.role === 'vet' ? 'bg-blue-100 text-blue-800' :
            'bg-teal-100 text-teal-800'
          }`}>
            {getRoleDisplayName(user.role)}
          </span>
        </div>
      </div>
    </div>
  );
};

const DeleteConfirmationModal = ({ user, onCancel, onConfirm, isDeleting }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-pop-in">
        <div className="p-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-center text-gray-800 mb-2">Confirmer la suppression</h3>
          <p className="text-gray-600 text-center mb-6">
            Êtes-vous sûr de vouloir supprimer le compte de <span className="font-semibold">{user?.username}</span> ?
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isDeleting}
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className={`px-6 py-2 rounded-lg text-white font-medium transition-colors ${
                isDeleting ? 'bg-red-300' : 'bg-red-600 hover:bg-red-700'
              }`}
              disabled={isDeleting}
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserListForAdmin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user: currentUser, loading: authLoading } = useAuth();

  const fetchUsers = useCallback(async () => {
    if (authLoading) return;

    if (!currentUser || currentUser.role !== 'admin') {
      setError("Accès réservé aux administrateurs");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const [clientsRes, vetsRes] = await Promise.all([
        axios.get(`${API_URL}/users/clients`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/users/vets`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setUsers([...clientsRes.data, ...vetsRes.data]);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [currentUser, authLoading]);

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/users/${userToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsers(users.filter(u => u._id !== userToDelete._id));
      setSuccessMessage(`${userToDelete.username} supprimé avec succès`);
      if (selectedUser?._id === userToDelete._id) {
        setSelectedUser(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de suppression");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || authLoading) return <Spinner />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h3 className="text-xl font-medium text-gray-800 mb-2">Erreur</h3>
        <p className="text-gray-600 max-w-md text-center">{error}</p>
      </div>
    );
  }

  if (selectedUser) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <UserProfileDetails
          user={selectedUser}
          onBack={() => setSelectedUser(null)}
          onDelete={handleDeleteUser}
        />
        {showDeleteModal && (
          <DeleteConfirmationModal
            user={userToDelete}
            onCancel={() => setShowDeleteModal(false)}
            onConfirm={confirmDeleteUser}
            isDeleting={deleting}
          />
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-lg flex items-center">
          <CheckCircle className="w-6 h-6 mr-3" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Gestion des Utilisateurs</h2>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map(user => (
              <UserCard
                key={user._id}
                user={user}
                onSelect={setSelectedUser}
                onDelete={handleDeleteUser}
              />
            ))}
          </div>
        )}
      </div>

      {showDeleteModal && (
        <DeleteConfirmationModal
          user={userToDelete}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={confirmDeleteUser}
          isDeleting={deleting}
        />
      )}
    </div>
  );
};

export default UserListForAdmin;