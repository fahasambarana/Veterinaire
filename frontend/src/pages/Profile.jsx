import { Edit } from "lucide-react";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function Profile() {
  const { user, updateUser, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);

  useEffect(() => {
    if (user) {
      setEditedUser(user);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedUser((prevUser) => ({ ...prevUser, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.put(
        "http://localhost:5000/api/users/profile",
        editedUser,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      updateUser(res.data.user);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {(user?.role === "admin" || user?.role === "vet") && (
        <Sidebar brand="PetCare" />
      )}
      {user?.role === "pet-owner" && <Navbar className="mt-8" />}

      <div
        className={`max-w-5xl mx-auto py-10 ${
          user?.role === "admin" || user?.role === "vet" ? "px-[150px]" : "px-6"
        }`}
      >
        <div className="bg-white rounded-2xl shadow-lg p-10">
          <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-10 space-y-6 md:space-y-0">
            <div className="relative">
              <img
                src={user.profilePicture || "/default-avatar.png"}
                alt="Profile"
                className="h-36 w-36 rounded-full object-cover border-4 border-white shadow-md hover:scale-105 transition-transform"
              />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-4xl font-bold text-gray-800">{user.username}</h2>
              <p className="text-gray-500 text-lg mt-1">{user.email}</p>

              {user?.role === "pet-owner" && (
                <div className="mt-4 flex justify-center md:justify-start space-x-6 text-sm text-gray-600">
                  <div>
                    <span className="font-semibold text-gray-800">
                      {user.animals?.length || 0}
                    </span>{" "}
                    Animaux
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">
                      {user.appointments?.length || 0}
                    </span>{" "}
                    Rendez-vous
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsEditing(true)}
                className="mt-5 text-blue-500 flex items-center justify-center md:justify-start hover:text-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                <span>Modifier le profil</span>
              </button>
            </div>
          </div>

          {user?.role === "pet-owner" && (
            <>
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Informations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-600 mb-1">Nom</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="username"
                        value={editedUser.username}
                        onChange={handleChange}
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    ) : (
                      <p className="text-gray-800">{user.username}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={editedUser.email}
                        onChange={handleChange}
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    ) : (
                      <p className="text-gray-800">{user.email}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Mes Animaux</h3>
                <div className="space-y-3">
                  {user.animals?.length > 0 ? (
                    user.animals.map((animal) => (
                      <div
                        key={animal.id}
                        className="flex justify-between items-center p-3 bg-teal-50 rounded-lg shadow-sm hover:bg-teal-100 transition"
                      >
                        <span>
                          {animal.name} ({animal.type})
                        </span>
                        <button className="text-teal-600 hover:text-teal-800">Voir</button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">Aucun animal enregistré.</p>
                  )}
                </div>
              </div>

              <div className="mt-10">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Rendez-vous</h3>
                <div className="space-y-3">
                  {user.appointments?.length > 0 ? (
                    user.appointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex justify-between items-center p-3 bg-teal-50 rounded-lg shadow-sm hover:bg-teal-100 transition"
                      >
                        <span>
                          {appointment.date} - {appointment.details}
                        </span>
                        <button className="text-teal-600 hover:text-teal-800">Voir</button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">Aucun rendez-vous prévu.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {isEditing && (
            <div className="flex justify-end space-x-4 pt-4 border-t mt-8">
              <button
                onClick={() => setIsEditing(false)}
                className="px-5 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
              >
                Sauvegarder
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}