import axios from "axios";
import { useEffect, useState, useCallback } from "react"; // Add useCallback

// Use the backend URL from .env, with a fallback
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const useAuth = () => {
  const [user, setUser] = useState(null); // Stores authenticated user data
  const [loading, setLoading] = useState(true); // Manages loading state during authentication check

  // Helper function to normalize user data, ensuring 'id' is a string
  const normalizeUserData = useCallback((data) => {
    if (!data) return null;
    const normalizedId = String(data.id || data._id); // Ensure ID is always a string
    // console.log("useAuth - Normalized User ID:", normalizedId); // Debugging log
    return {
      ...data,
      id: normalizedId,
    };
  }, []);

  // Login function now uses the normalization helper
  const login = useCallback((userData, token) => {
    localStorage.setItem("token", token);
    // Optionally, store the raw user data and normalize when retrieved
    // Or store the normalized data directly:
    const normalizedUser = normalizeUserData(userData);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    setUser(normalizedUser);
  }, [normalizeUserData]);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    console.log("User logged out.");
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true); // Ensure loading is true at the start of fetch operation

      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setUser(null); // No token, no user
          setLoading(false);
          return;
        }

        // Validate the token with the backend
        const res = await axios.get(`${API_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true, // Keep this if your backend relies on session cookies/credentials alongside tokens
        });

        if (res.data && res.data.user) {
          // Use the normalization helper when setting user from API response
          setUser(normalizeUserData(res.data.user));
        } else {
          // Backend responded, but no valid user data
          setUser(null);
          localStorage.removeItem("token");
          console.warn("Auth: No user data returned from profile endpoint despite token present. Token might be invalid or expired. Token cleared.");
        }
      } catch (error) {
        console.error("Auth error during token validation:", error);
        // If the token is invalid (e.g., 401 Unauthorized), clear it from localStorage
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          localStorage.removeItem("token");
          console.log("Auth: Invalid or expired token, cleared from localStorage.");
        }
        setUser(null); // Clear user state on any error
      } finally {
        setLoading(false); // Always set loading to false after the attempt
      }
    };

    fetchUser();
  }, [normalizeUserData]); // Dependency on normalizeUserData

  return { user, loading, login, logout, isAuthenticated: !!user };
};

export default useAuth;