import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger l'utilisateur s'il y a un token
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

        const fetchedUser = {
          ...res.data.user,
          id: res.data.user.id || res.data.user._id, // ✅ normalisation
        };

        setUser(fetchedUser);
        localStorage.setItem("user", JSON.stringify(fetchedUser)); // ✅ ajout localStorage
      } catch (err) {
        console.error("Erreur lors du chargement du profil:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);

      const newUser = {
        ...res.data.user,
        id: res.data.user.id || res.data.user._id, // ✅ normalisation
      };

      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser)); // ✅ ajout localStorage
    } catch (err) {
      throw err;
    }
  };

  const inscription = async (formData) => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", formData);
      localStorage.setItem("token", res.data.token);

      const newUser = {
        ...res.data.user,
        id: res.data.user.id || res.data.user._id,
      };

      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser)); // ✅ ajout localStorage
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    const newUser = {
      ...updatedUser,
      id: updatedUser.id || updatedUser._id,
    };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser)); // ✅ mise à jour locale
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

export const useAuth = () => useContext(AuthContext);
