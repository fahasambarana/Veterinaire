import { Edit, Camera } from "lucide-react"; // Importez l'icône Camera
import { useEffect, useState, useRef } from "react"; // Importez useRef
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

// Assurez-vous que API_URL est défini
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
  const [animalCount, setAnimalCount] = useState(0);

  // Nouvel état pour l'upload d'image de profil
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null); // Réf pour le champ de fichier caché

  // Synchronise editedUser chaque fois que user change
  useEffect(() => {
    if (user) {
      setEditedUser({
        username: user.username || "",
        email: user.email || "",
      });
      // Initialise la prévisualisation avec la photo de profil actuelle de l'utilisateur
      // en s'assurant que le chemin est une URL complète
      if (user.profilePicture) {
        const fullProfilePictureUrl = user.profilePicture.startsWith('/uploads')
          ? `${API_URL}${user.profilePicture}`
          : user.profilePicture;
        setImagePreview(fullProfilePictureUrl);
      } else {
        setImagePreview("/default-avatar.png");
      }
    }
  }, [user, API_URL]); // Ajout de API_URL aux dépendances

  // Gérer la prévisualisation de l'image sélectionnée
  // Ce useEffect est déclenché par `selectedImage` ou la mise à jour de `user.profilePicture`
  useEffect(() => {
    if (selectedImage) {
      // Si une nouvelle image est sélectionnée, affichez sa prévisualisation temporaire
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(selectedImage);
    } else {
      // Si aucune image n'est sélectionnée (ou si elle a été réinitialisée après l'upload),
      // affichez la photo de profil actuelle de l'utilisateur depuis le contexte.
      if (user?.profilePicture) {
        const fullProfilePictureUrl = user.profilePicture.startsWith('/uploads')
          ? `${API_URL}${user.profilePicture}`
          : user.profilePicture;
        setImagePreview(fullProfilePictureUrl);
      } else {
        setImagePreview("/default-avatar.png");
      }
    }
    // Dépendances : selectedImage (pour la prévisualisation temporaire),
    // et user?.profilePicture (pour la source de vérité après l'upload)
  }, [selectedImage, user?.profilePicture, API_URL]);


  // Gérer les updates de formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Fonction pour gérer la sélection de fichier
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file); // Définit l'image sélectionnée pour la prévisualisation immédiate
      handleImageUpload(file); // Lance l'upload automatiquement après la sélection
    }
  };

  // Fonction pour déclencher l'input file
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Fonction pour envoyer l'image de profil
  const handleImageUpload = async (fileToUpload) => {
    if (!fileToUpload) return;

    setUploadingImage(true);
    setErrorMessage("");
    setSuccessMessage("");

    const formData = new FormData();
    formData.append("profilePicture", fileToUpload); // 'profilePicture' doit correspondre au nom du champ attendu par Multer

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Vous devez être connecté pour télécharger une photo.");
        setSelectedImage(null); // Réinitialise la prévisualisation en cas d'échec d'authentification
        setUploadingImage(false);
        return;
      }
      const res = await axios.put(`${API_URL}/api/users/profile/picture`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", // Indispensable pour FormData
        },
      });

      // Met à jour le contexte utilisateur avec la nouvelle photo (qui devrait contenir le chemin complet ou relatif)
      updateUser(res.data.user);
      setSuccessMessage("Photo de profil mise à jour avec succès !");
      setSelectedImage(null); // Réinitialise l'image sélectionnée après un upload réussi.
                              // Cela permettra au useEffect de revenir à la photo de l'utilisateur mise à jour.
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Erreur lors du téléchargement de la photo de profil:", err);
      setErrorMessage(
        err?.response?.data?.message || "Erreur lors de la mise à jour de la photo de profil."
      );
      setSelectedImage(null); // En cas d'erreur, réinitialise la prévisualisation
    } finally {
      setUploadingImage(false);
    }
  };


  // Chargement des pets et appointments
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setErrorMessage("Utilisateur non authentifié.");
          return;
        }
        const [petsRes, appointmentsRes] = await Promise.all([
          axios.get(`${API_URL}/api/pets/mine`, { // Utiliser API_URL
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/api/appointments/mine`, { // Utiliser API_URL
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setPets(petsRes.data);
        setAnimalCount(petsRes.data.length);
        setAppointments(appointmentsRes.data);
        setErrorMessage(""); // Clear previous errors
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
  }, [user, API_URL]); // Ajout de API_URL aux dépendances

  const handleSave = async () => {
    setErrorMessage("");
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Vous devez être connecté pour modifier le profil.");
        return;
      }
      const res = await axios.put(`${API_URL}/api/users/profile`, editedUser, { // Utiliser API_URL
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
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-xl text-gray-700">
        Chargement du profil...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-xl text-red-600">
        Erreur: Impossible de charger le profil. Veuillez vous connecter.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {(user.role === "admin" || user.role === "vet") && <Sidebar brand="PetCare" />}
      {user.role === "pet-owner" && <Navbar className="mt-8" />}

      <div
        className={`max-w-5xl mx-auto py-10 ${
          user.role === "admin" || user.role === "vet"
            ? "pl-[150px] pr-6"
            : "px-6"
        }`}
      >
        <div className="bg-white rounded-2xl shadow-xl p-10 ring-1 ring-gray-100">
          <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-10 space-y-6 md:space-y-0">
            <div className="relative flex-shrink-0">
              {/* Input file caché */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              {/* Image de profil */}
              <img
                src={imagePreview || "/default-avatar.png"} // Utilise la prévisualisation ou l'avatar par défaut
                alt="Profile"
                className="h-40 w-40 rounded-full object-cover border-6 border-white shadow-lg hover:scale-105 transition-transform duration-300"
              />
              {/* Bouton/Icône de caméra pour déclencher l'upload */}
              <button
                onClick={triggerFileInput}
                className="absolute bottom-0 right-0 bg-teal-600 text-white p-2 rounded-full shadow-lg hover:bg-teal-700 transition duration-300 flex items-center justify-center"
                title="Changer la photo de profil"
                disabled={uploadingImage} // Désactiver pendant l'upload
              >
                {uploadingImage ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <Camera className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="text-center md:text-left flex-grow">
              <h2 className="text-5xl font-extrabold text-gray-900 leading-tight">
                {user.username || "Nom d'utilisateur"}
              </h2>
              <p className="text-gray-600 text-xl mt-2">
                {user.email || "Email non défini"}
              </p>

              {user.role === "pet-owner" && (
                <div className="mt-6 flex justify-center md:justify-start space-x-8 text-md text-gray-700 divide-x divide-gray-200">
                  <div className="pr-4">
                    <span className="font-bold text-xl text-teal-700 block">{animalCount}</span>
                    <span className="text-sm text-gray-500 block">Animaux</span>
                  </div>
                  <div className="pl-4">
                    <span className="font-bold text-xl text-teal-700 block">{appointments.length}</span>
                    <span className="text-sm text-gray-500 block">Rendez-vous</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsEditing(true)}
                className="mt-8 text-teal-600 flex items-center justify-center md:justify-start hover:text-teal-800 hover:underline transition duration-200 font-medium"
              >
                <Edit className="h-5 w-5 mr-2" />
                <span>Modifier le profil</span>
              </button>
            </div>
          </div>

          {successMessage && (
            <div className="mt-6 text-green-600 text-center font-medium">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mt-6 text-red-600 text-center font-medium">
              {errorMessage}
            </div>
          )}

          {user.role === "pet-owner" && (
            <>
              <div className="mt-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 pb-2 border-teal-200">
                  Informations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-gray-600 text-sm font-medium mb-1">
                      Nom d'utilisateur
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="username"
                        value={editedUser?.username || ""}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
                      />
                    ) : (
                      <p className="text-gray-800 text-lg font-medium">{user.username}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm font-medium mb-1">
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={editedUser?.email || ""}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
                      />
                    ) : (
                      <p className="text-gray-800 text-lg font-medium">{user.email}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 pb-2 border-teal-200">
                  Mes Animaux
                </h3>
                <div className="space-y-4">
                  {pets.length > 0 ? (
                    pets.map((animal) => (
                      <div
                        key={animal._id}
                        className="flex justify-between items-center p-4 bg-teal-50 rounded-lg shadow-md hover:bg-teal-100 transition duration-200"
                      >
                        <span className="text-lg font-medium text-gray-800">
                          {animal.name} ({animal.species})
                        </span>
                        <button className="text-teal-600 hover:text-teal-800 font-medium transition">Voir</button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-lg">Aucun animal enregistré.</p>
                  )}
                </div>
              </div>

              <div className="mt-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 pb-2 border-teal-200">
                  Rendez-vous
                </h3>
                <div className="space-y-4">
                  {appointments.length > 0 ? (
                    appointments.map((appointment) => (
                      <div
                        key={appointment._id}
                        className="flex justify-between items-center p-4 bg-teal-50 rounded-lg shadow-md hover:bg-teal-100 transition duration-200"
                      >
                        <span className="text-lg font-medium text-gray-800">
                          {new Date(appointment.date).toLocaleDateString()} - {appointment.reason || "Sans détails"}
                        </span>
                        <button className="text-teal-600 hover:text-teal-800 font-medium transition">Voir</button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-lg">Aucun rendez-vous prévu.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {isEditing && (
            <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200 mt-12">
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition duration-200"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-6 py-2 rounded-lg font-medium transition duration-200 ${
                  saving
                    ? "bg-gray-400 text-white"
                    : "bg-teal-600 text-white hover:bg-teal-700"
                }`}
              >
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}