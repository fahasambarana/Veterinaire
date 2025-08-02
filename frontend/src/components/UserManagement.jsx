// frontend/src/pages/UserManagementPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";
// LayoutSidebar n'est plus importé ici car il sera fourni par le composant parent (GestionUtilisateurs)
import {
  Users,
  UserCheck,
  UserX,
  UserMinus,
  Search,
  Filter,
  RefreshCcw,
  Loader2, // Loader2 est l'icône de lucide-react pour un spinner
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const UserManagementPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState({}); // State for individual user action loading

  const roles = ["pet-owner", "vet", "admin"];
  const statuses = ["active", "pending", "rejected"];

  // Utility to clear messages after a timeout
  const clearMessages = useCallback((setter) => {
    setTimeout(() => setter(null), 5000);
  }, []);

  const fetchUsers = useCallback(async () => {
    if (authLoading || !user || user.role !== "admin") {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      const response = await axios.get(`${API_URL}/users/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          role: filterRole,
          status: filterStatus,
          search: searchTerm,
        },
      });
      setUsers(response.data);
    } catch (err) {
      console.error("Erreur lors du chargement des utilisateurs:", err);
      setError(err.response?.data?.message || "Échec du chargement des utilisateurs.");
      clearMessages(setError);
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, filterRole, filterStatus, searchTerm, clearMessages]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdateUser = async (userId, updateData) => {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    setError(null);
    setSuccessMessage(null);
    const token = localStorage.getItem("token");

    try {
      const response = await axios.put(`${API_URL}/users/${userId}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMessage(response.data.message);
      clearMessages(setSuccessMessage);
      fetchUsers(); // Re-fetch users to update the list
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'utilisateur:", err);
      setError(err.response?.data?.message || "Échec de la mise à jour de l'utilisateur.");
      clearMessages(setError);
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    setError(null);
    setSuccessMessage(null);
    const token = localStorage.getItem("token");

    try {
      const response = await axios.delete(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMessage(response.data.message);
      clearMessages(setSuccessMessage);
      fetchUsers(); // Re-fetch users to update the list
    } catch (err) {
      console.error("Erreur lors de la suppression de l'utilisateur:", err);
      setError(err.response?.data?.message || "Échec de la suppression de l'utilisateur.");
      clearMessages(setError);
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  // Le composant Spinner est défini ici, il n'est pas importé de lucide-react
  const Spinner = () => (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
    </div>
  );

  // Les vérifications d'autorisation sont toujours présentes
  if (authLoading) {
    return (
        <div className="text-center py-8 text-gray-700 mx-auto mt-8">
          <Spinner />
          <p className="mt-2">Vérification des autorisations...</p>
        </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg text-center text-red-600 mx-auto mt-20 border border-red-200 animate-fade-in-down">
          <h3 className="text-2xl font-bold mb-4">Accès Refusé</h3>
          <p>Vous n'êtes pas autorisé à accéder à cette page.</p>
        </div>
    );
  }

  return (
    // Le contenu de la page est maintenant directement retourné, sans LayoutSidebar
    <div className="min-h-screen ml-[-20px] p-8 bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-xl mx-auto max-w-6xl border border-gray-200 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-teal-700 flex items-center">
            <Users className="w-7 h-7 mr-3 text-teal-600" /> Gestion des Utilisateurs
          </h2>
          <button
            onClick={fetchUsers}
            className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
          >
            <RefreshCcw className="w-5 h-5 mr-2" /> Actualiser
          </button>
        </div>

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 animate-fade-in-down" role="alert">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="block sm:inline font-medium">{successMessage}</span>
              <button
                onClick={() => setSuccessMessage(null)}
                className="absolute top-0 right-0 px-4 py-3 text-green-700 hover:text-green-900"
                aria-label="Close alert"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 animate-fade-in-down" role="alert">
            <div className="flex items-center">
              <Info className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="block sm:inline font-medium">{error}</span>
              <button
                onClick={() => setError(null)}
                className="absolute top-0 right-0 px-4 py-3 text-red-700 hover:text-red-900"
                aria-label="Close alert"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center">
            <Filter className="w-5 h-5 text-gray-500 mr-2" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Tous les rôles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <Filter className="w-5 h-5 text-gray-500 mr-2" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Tous les statuts</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <Search className="w-5 h-5 text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Spinner />
            <p className="mt-2 text-gray-600">Chargement des utilisateurs...</p>
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Aucun utilisateur trouvé.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom d'utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'vet' ? 'bg-teal-100 text-teal-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        u.status === 'active' ? 'bg-green-100 text-green-800' :
                        u.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                      </span>
                      {u.status === 'pending' && u.vetJustification && (
                          <p className="text-xs text-gray-500 mt-1 italic">Justification: {u.vetJustification}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {actionLoading[u._id] ? (
                        <Spinner />
                      ) : (
                        <div className="flex space-x-2">
                          {u.role === "vet" && u.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleUpdateUser(u._id, { status: "active" })}
                                className="text-green-600 hover:text-green-900 transform hover:scale-110 transition duration-150"
                                title="Approuver Vétérinaire"
                              >
                                <UserCheck className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleUpdateUser(u._id, { status: "rejected" })}
                                className="text-red-600 hover:text-red-900 transform hover:scale-110 transition duration-150"
                                title="Rejeter Vétérinaire"
                              >
                                <UserX className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          {u.role === "vet" && u.status === "rejected" && (
                              <button
                                onClick={() => handleUpdateUser(u._id, { status: "pending" })}
                                className="text-yellow-600 hover:text-yellow-900 transform hover:scale-110 transition duration-150"
                                title="Remettre en attente"
                              >
                                <RefreshCcw className="w-5 h-5" />
                              </button>
                          )}
                          {u.role !== "admin" && ( // Admins cannot delete other admins or themselves via this interface
                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              className="text-red-600 hover:text-red-900 transform hover:scale-110 transition duration-150"
                              title="Supprimer Utilisateur"
                            >
                              <UserMinus className="w-5 h-5" />
                            </button>
                          )}
                          {/* Option to change role (e.g., vet to pet-owner, pet-owner to vet) */}
                          {u.role !== "admin" && ( // Only change non-admin roles
                              <select
                                  value={u.role}
                                  onChange={(e) => handleUpdateUser(u._id, { role: e.target.value })}
                                  className="ml-2 p-1 border border-gray-300 rounded-md text-xs bg-white"
                                  title="Changer le rôle"
                              >
                                  {roles.filter(r => r !== 'admin').map(r => ( // Admin cannot assign admin role here
                                      <option key={r} value={r}>
                                          {r.charAt(0).toUpperCase() + r.slice(1)}
                                      </option>
                                  ))}
                              </select>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;
