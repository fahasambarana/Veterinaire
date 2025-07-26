import React, { useEffect, useState } from "react";
import axios from "axios";
import { User, Mail, Phone, Loader2 } from "lucide-react"; // Import Loader2 for loading indicator

// Assuming API_URL is accessible globally or defined in AdminDashboard's context.
// If not, you might need to pass it as a prop or define it here if it's consistent.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Helper function to truncate text and add ellipsis
const truncateText = (text, maxLength) => {
  if (!text) return ''; // Handle cases where text might be null or undefined
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
};

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true); // New loading state
  const [error, setError] = useState(null);     // New error state

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true); // Start loading
      setError(null);   // Clear previous errors
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentification requise pour charger la liste des clients.");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/users/clients`, { // Use API_URL
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setClients(res.data);
      } catch (err) {
        console.error("Erreur chargement clients :", err.response?.data?.message || err.message);
        setError("Échec du chargement de la liste des clients."); // Set user-friendly error
      } finally {
        setLoading(false); // End loading
      }
    };

    fetchClients();
  }, []); // Empty dependency array means this runs once on component mount

  // Determine which clients to display based on 'showAll' state
  const visibleClients = showAll ? clients : clients.slice(0, 3);

  // Define maximum lengths for truncation. Adjust these values as per your design needs.
  const MAX_NAME_LENGTH = 22; // For the username (name)
  const MAX_EMAIL_LENGTH = 28; // For the email address
  const MAX_PHONE_LENGTH = 18; // For phone numbers, less likely to need truncation but added for consistency

  // Conditional rendering based on loading, error, and data presence
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" /> {/* Spinner icon */}
        <p className="ml-3 text-gray-600">Chargement des clients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
        <strong className="font-bold">Erreur: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (clients.length === 0 && !loading && !error) {
    return (
      <p className="text-center text-gray-500 py-4">Aucun client enregistré pour le moment.</p>
    );
  }

  return (
    <div>
      <ul className="space-y-4">
        {visibleClients.map((user) => (
          <li
            key={user._id}
            // Added transition for smoother hover effects and consistent styling
            className="flex items-start bg-gray-50 rounded-xl shadow-sm p-4 hover:shadow-md hover:bg-gray-100 transition duration-300 ease-in-out"
          >
            <div className="flex-shrink-0 mr-3">
              {/* Made icons slightly larger for better visibility */}
              <User className="text-teal-600 w-6 h-6" />
            </div>
            {/* min-w-0 ensures the flex item (text content) can shrink if needed, preventing overflow */}
            <div className="flex-grow min-w-0">
              {/* Username (Name): Truncated with full text visible on hover */}
              <p className="text-gray-800 font-semibold text-base truncate" title={user.username}>
                {truncateText(user.username, MAX_NAME_LENGTH)}
              </p>
              {/* Email: Truncated with full text visible on hover */}
              <div className="flex items-center text-sm text-gray-600 mt-0.5">
                {/* flex-shrink-0 prevents the icon from shrinking */}
                <Mail size={16} className="mr-1 flex-shrink-0" />
                <span className="truncate" title={user.email}>
                    {truncateText(user.email, MAX_EMAIL_LENGTH)}
                </span>
              </div>
              {/* Phone: Truncated with full text visible on hover */}
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <Phone size={16} className="mr-1 flex-shrink-0" />
                <span className="truncate" title={user.phone || "Non fourni"}>
                    {truncateText(user.phone || "Non fourni", MAX_PHONE_LENGTH)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* "Voir plus/moins" button, displayed only if there are more than 3 clients */}
      {clients.length > 3 && (
        <div className="text-center mt-4">
          <button
            onClick={() => setShowAll(!showAll)}
            // Enhanced button styling for smoother interaction and better focus indication
            className="text-teal-700 hover:underline font-medium px-4 py-2 rounded-lg transition duration-300 ease-in-out hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
          >
            {showAll ? "Voir moins" : "Voir plus"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ClientList;