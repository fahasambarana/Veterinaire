import { Edit, Camera, PawPrint, CalendarDays } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { CheckCircle, XCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Profile() {
  const { user, updateUser, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ username: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setEditedUser({
        username: user.username || "",
        email: user.email || "",
      });
      if (user.profilePicture) {
        const fullProfilePictureUrl = user.profilePicture.startsWith('/uploads')
          ? `${API_URL}${user.profilePicture}`
          : user.profilePicture;
        setImagePreview(fullProfilePictureUrl);
      } else {
        setImagePreview("/default-avatar.png");
      }
    }
  }, [user, API_URL]);

  useEffect(() => {
    if (selectedImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(selectedImage);
    } else if (user?.profilePicture) {
      const fullProfilePictureUrl = user.profilePicture.startsWith('/uploads')
        ? `${API_URL}${user.profilePicture}`
        : user.profilePicture;
      setImagePreview(fullProfilePictureUrl);
    } else {
      setImagePreview("/default-avatar.png");
    }
  }, [selectedImage, user?.profilePicture, API_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      handleImageUpload(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleImageUpload = async (fileToUpload) => {
    if (!fileToUpload) return;

    setUploadingImage(true);
    setErrorMessage("");
    setSuccessMessage("");

    const formData = new FormData();
    formData.append("profilePicture", fileToUpload);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Vous devez être connecté pour télécharger une photo.");
        setSelectedImage(null);
        setUploadingImage(false);
        return;
      }
      const res = await axios.put(`${API_URL}/api/users/profile/picture`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      updateUser(res.data.user);
      setSuccessMessage("Photo de profil mise à jour avec succès !");
      setSelectedImage(null);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Erreur lors du téléchargement de la photo de profil:", err);
      setErrorMessage(
        err?.response?.data?.message || "Erreur lors de la mise à jour de la photo de profil."
      );
      setSelectedImage(null);
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setErrorMessage("Utilisateur non authentifié.");
          return;
        }
        const [petsRes, appointmentsRes] = await Promise.all([
          axios.get(`${API_URL}/api/pets/mine`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/api/appointments/mine`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setPets(petsRes.data);
        setAppointments(appointmentsRes.data);
        setErrorMessage("");
      } catch (err) {
        console.error("Erreur lors du chargement des données dynamiques:", err);
        setErrorMessage(
          err?.response?.data?.message ||
            "Erreur lors du chargement des données dynamiques"
        );
      }
    };
    if (user?.role === "pet-owner") {
      fetchData();
    }
  }, [user, API_URL]);

  const handleSave = async () => {
    setErrorMessage("");
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Vous devez être connecté pour modifier le profil.");
        return;
      }
      const res = await axios.put(`${API_URL}/api/users/profile`, editedUser, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      updateUser(res.data.user);
      setIsEditing(false);
      setSuccessMessage("Profil mis à jour avec succès !");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Échec mise à jour du profil:", err);
      setErrorMessage(
        err?.response?.data?.message || "Erreur lors de la mise à jour du profil."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 to-white text-xl text-red-600">
        Erreur: Impossible de charger le profil. Veuillez vous connecter.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white">
      {(user.role === "admin" || user.role === "vet") && <Sidebar brand="PetCare" />}
      {user.role === "pet-owner" && <Navbar />}

      <div
        className={`max-w-6xl mx-auto py-10 ${
          user.role === "admin" || user.role === "vet"
            ? "pl-[150px] pr-6"
            : "px-6"
        }`}
      >
        {/* Carte de profil principale */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 ring-1 ring-white/10 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Section photo de profil */}
            <div className="relative flex-shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <div className="relative group">
                <img
                  src={imagePreview || "/default-avatar.png"}
                  alt="Profile"
                  className="h-48 w-48 rounded-full object-cover border-4 border-white shadow-xl transition-all duration-300 group-hover:opacity-90"
                />
                <button
                  onClick={triggerFileInput}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 rounded-full transition-opacity duration-300"
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <Camera className="h-8 w-8 text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Section informations */}
            <div className="text-center md:text-left flex-grow space-y-4">
              <div>
                <span className="inline-block px-3 py-1 text-xs font-semibold bg-teal-100 text-teal-800 rounded-full mb-2">
                  {user.role === 'pet-owner' ? 'Propriétaire' : 
                   user.role === 'vet' ? 'Vétérinaire' : 'Administrateur'}
                </span>
                <h1 className="text-4xl font-bold text-gray-900">
                  {user.username || "Nom d'utilisateur"}
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  {user.email || "Email non défini"}
                </p>
              </div>

              {user.role === "pet-owner" && (
                <div className="flex justify-center md:justify-start gap-6">
                  <div className="flex items-center gap-2 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    <PawPrint className="h-5 w-5 text-teal-600" />
                    <div>
                      <div className="font-bold text-xl text-gray-800">{pets.length}</div>
                      <div className="text-xs text-gray-500">Animaux</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    <CalendarDays className="h-5 w-5 text-teal-600" />
                    <div>
                      <div className="font-bold text-xl text-gray-800">{appointments.length}</div>
                      <div className="text-xs text-gray-500">Rendez-vous</div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 bg-white border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors duration-200"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier le profil
              </button>
            </div>
          </div>

          {/* Messages d'état */}
          {successMessage && (
            <div className="mt-6 p-3 bg-green-50 text-green-700 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mt-6 p-3 bg-red-50 text-red-700 rounded-lg flex items-center justify-center">
              <XCircle className="h-5 w-5 mr-2" />
              {errorMessage}
            </div>
          )}

          {/* Section édition */}
          {isEditing && (
            <div className="mt-8 pt-8 border-t border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Modifier les informations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
                  <input
                    type="text"
                    name="username"
                    value={editedUser?.username || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editedUser?.email || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-6 py-2 rounded-xl font-medium transition-colors ${
                    saving ? "bg-gray-400" : "bg-teal-600 hover:bg-teal-700 text-white"
                  }`}
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </div>
          )}

          {/* Sections supplémentaires pour propriétaires */}
          {user.role === "pet-owner" && (
            <div className="mt-12 space-y-12">
              {/* Section Animaux */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <PawPrint className="h-6 w-6 text-teal-600" />
                    Mes Animaux
                  </h3>
                  <button className="text-sm text-teal-600 hover:text-teal-800 font-medium">
                    Voir tous
                  </button>
                </div>
                {pets.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pets.slice(0, 3).map((animal) => (
                      <div
                        key={animal._id}
                        className="bg-white p-4 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-teal-100 p-2 rounded-lg">
                            <PawPrint className="h-5 w-5 text-teal-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{animal.name}</h4>
                            <p className="text-sm text-gray-500">{animal.species}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {pets.length > 3 && (
                      <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">+{pets.length - 3} autres</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-8 rounded-xl text-center">
                    <PawPrint className="h-10 w-10 mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-2">Aucun animal enregistré</p>
                  </div>
                )}
              </div>

              {/* Section Rendez-vous */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <CalendarDays className="h-6 w-6 text-teal-600" />
                    Mes Rendez-vous
                  </h3>
                  <button className="text-sm text-teal-600 hover:text-teal-800 font-medium">
                    Voir tous
                  </button>
                </div>
                {appointments.length > 0 ? (
                  <div className="space-y-3">
                    {appointments.slice(0, 3).map((appointment) => (
                      <div
                        key={appointment._id}
                        className="bg-white p-4 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <CalendarDays className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-semibold text-gray-800">
                              {new Date(appointment.date).toLocaleDateString('fr-FR', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </h4>
                            <p className="text-sm text-gray-500">{appointment.reason || "Sans détails"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {appointments.length > 3 && (
                      <div className="text-center mt-4">
                        <button className="text-teal-600 hover:text-teal-800 text-sm font-medium">
                          + Voir {appointments.length - 3} autres rendez-vous
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-8 rounded-xl text-center">
                    <CalendarDays className="h-10 w-10 mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-2">Aucun rendez-vous prévu</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}