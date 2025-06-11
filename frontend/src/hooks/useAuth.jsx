import axios from "axios";
import { useEffect, useState } from "react";

const useAuth = () => {
  const [user, setUser] = useState(null);  // Store user data
  const [loading, setLoading] = useState(true);  // Manage loading state

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Retrieve the token from localStorage
        const token = localStorage.getItem("token"); 
        
        // If no token is found, stop here and set loading to false
        if (!token) {
          setLoading(false);  
          return;  // User is not authenticated, skip further actions
        }

        // Send a request to the backend to validate the token
        const res = await axios.get("http://localhost:5000/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,  // Allow cookies to be sent
        });

        // Check if the backend responded with user data
        if (res.data.user) {
          setUser(res.data.user);  // Set the user state with the response data
        } else {
          setUser(null);  // In case the user data is invalid, clear the user state
        }
      } catch (error) {
        console.error("Auth error:", error);  // Log any errors for debugging
        setUser(null);  // On error, set user to null (logout user)
      } finally {
        setLoading(false);  // Finish loading state after request completion
      }
    };

    fetchUser();  // Execute the fetch user function on mount
  }, []);  // This effect runs once on initial render

  return { user, loading };  // Return both user data and loading state
};

export default useAuth;
