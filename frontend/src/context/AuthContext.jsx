import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";

// Créer le contexte
const AuthContext = createContext();

// Composant provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // pour indiquer que les données sont en cours de chargement

  // Charger l'utilisateur au montage si un token est présent
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data.user); // Supposant que res.data.user contient les infos
      } catch (err) {
        console.error("Erreur lors du chargement du profil:", err);
        localStorage.removeItem("token"); // Nettoyage en cas d'erreur (token expiré)
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Fonction de connexion
  const login = async (email, password) => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
    } catch (err) {
      throw err; // à gérer dans le composant appelant
    }
  };

  // Fonction d'inscription
  const inscription = async (formData) => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", formData);
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user); // <- important d'ajouter ça si le backend le retourne
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  // Déconnexion
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // Mettre à jour localement les données de l'utilisateur (après modification du profil par exemple)
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        inscription,
        login,
        logout,
        updateUser,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour consommer le contexte
export const useAuth = () => useContext(AuthContext);
