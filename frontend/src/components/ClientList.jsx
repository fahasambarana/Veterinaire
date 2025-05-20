import React, { useEffect, useState } from "react";
import axios from "axios";
import { User, Mail, Phone } from "lucide-react";

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get("http://localhost:5000/api/users/clients", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setClients(res.data);
      } catch (err) {
        console.error("Erreur chargement clients :", err.response?.data || err.message);
      }
    };

    fetchClients();
  }, []);

  const visibleClients = showAll ? clients : clients.slice(0, 3);

  return (
    <div>
      <ul className="space-y-4">
        {visibleClients.map((user) => (
          <li
            key={user._id}
            className="flex items-start bg-gray-50 rounded-xl shadow-sm p-4 hover:shadow-md transition"
          >
            <div className="flex-shrink-0 mr-3">
              <User className="text-teal-600" />
            </div>
            <div>
              <p className="text-gray-800 font-semibold">{user.username}</p>
              <div className="flex items-center text-sm text-gray-600">
                <Mail size={16} className="mr-1" />
                {user.email}
              </div>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <Phone size={16} className="mr-1" />
                {user.phone || "Non fourni"}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {clients.length > 3 && (
        <div className="text-center mt-4">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-teal-700 hover:underline font-medium"
          >
            {showAll ? "Voir moins" : "Voir plus"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ClientList;
