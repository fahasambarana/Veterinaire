// frontend/src/components/AppointmentForm.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import LayoutNavbar from "./LayoutNavbar"; // Assuming you have a LayoutNavbar component
import {
  CalendarDays, // For date input
  PawPrint, // For pet selection
  Stethoscope, // For vet selection
  ClipboardList, // For reason textarea
  CheckCircle, // For success message / submit button
  XCircle, // For error message / close button
  Loader2, // For loading spinner
  ArrowLeft, // For back button
  Info, // For empty state/placeholder
} from "lucide-react"; // Importation d'icônes Lucide

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AppointmentForm = ({ onSuccess }) => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    petId: "",
    vetId: "",
    date: "",
    reason: "",
  });

  const [pets, setPets] = useState([]);
  const [vets, setVets] = useState([]);
  const [notification, setNotification] = useState({ message: "", type: "" }); // { message: "", type: "success" | "error" }
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Utility to clear notifications after a timeout
  const clearNotification = useCallback(() => {
    setTimeout(() => setNotification({ message: "", type: "" }), 5000);
  }, []);

  const token = localStorage.getItem("token"); // Get token once

  // Fetch pets and vets data
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setNotification({
          message: "Vous n'êtes pas authentifié. Redirection vers la connexion...",
          type: "error",
        });
        clearNotification();
        navigate('/login');
        return;
      }

      try {
        setLoadingInitialData(true);
        const petsRes = await axios.get(`${API_URL}/pets/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPets(petsRes.data);

        const vetsRes = await axios.get(`${API_URL}/users/vets`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setVets(vetsRes.data);
      } catch (err) {
        console.error("Erreur chargement données :", err.response?.data?.message || err.message);
        setNotification({
          message: `Échec du chargement des données : ${err.response?.data?.message || err.message}`,
          type: "error",
        });
        clearNotification();
      } finally {
        setLoadingInitialData(false);
      }
    };

    fetchData();
  }, [token, navigate, clearNotification]); // Dependencies: token, navigate, clearNotification

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification({ message: "", type: "" }); // Clear previous notifications
    setIsSubmitting(true); // Start submitting state

    if (!token) {
      setNotification({
        message: "Vous n'êtes pas authentifié. Veuillez vous reconnecter.",
        type: "error",
      });
      setIsSubmitting(false);
      clearNotification();
      return;
    }

    // Basic client-side validation
    if (!form.petId || !form.vetId || !form.date || !form.reason.trim()) {
      setNotification({
        message: "Veuillez remplir tous les champs obligatoires.",
        type: "error",
      });
      setIsSubmitting(false);
      clearNotification();
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/appointments/create`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setNotification({
        message: "✅ Rendez-vous créé avec succès !",
        type: "success",
      });
      setForm({ petId: "", vetId: "", date: "", reason: "" }); // Clear form on success
      onSuccess && onSuccess(); // Call parent success handler if provided

      console.log("RDV créé :", res.data);

      // Redirect after a short delay to allow success message to be seen
      setTimeout(() => {
        setNotification({ message: "", type: "" }); // Clear notification before redirect
        navigate("/appointments"); // Redirige vers la liste des RDV
      }, 2000);

    } catch (err) {
      console.error("Erreur création RDV :", err.response?.data || err.message);
      setNotification({
        message: `❌ Échec de la création du rendez-vous : ${
          err.response?.data?.message || err.message
        }`,
        type: "error",
      });
      clearNotification(); // Clear error notification after timeout
    } finally {
      setIsSubmitting(false); // End submitting state
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  if (loadingInitialData) {
    return (
      <LayoutNavbar>
        <div className="flex flex-col justify-center items-center min-h-[400px] text-gray-700 bg-gray-50 rounded-xl shadow-md mx-auto my-8">
          <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-3" />
          <p className="text-lg">Chargement des données...</p>
        </div>
      </LayoutNavbar>
    );
  }

  return (
    <LayoutNavbar>
      <div className="min-h-screen p-8 bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-xl relative border border-gray-200 animate-fade-in">
          <h2 className="text-3xl font-extrabold mb-8 text-teal-700 text-center">
            Prendre un rendez-vous
          </h2>

          {notification.message && (
            <div
              className={`absolute top-4 left-1/2 -translate-x-1/2 p-3 rounded-lg shadow-lg text-white text-sm font-semibold z-50 transition-all duration-300 transform ${
                notification.type === "success" ? "bg-green-500" : "bg-red-500"
              } ${notification.message ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
              role="alert"
            >
              {notification.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sélection de l'animal */}
            <div>
              <label
                htmlFor="petId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Animal <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all duration-200">
                <PawPrint className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
                <select
                  id="petId"
                  name="petId"
                  value={form.petId}
                  onChange={handleChange}
                  required
                  className="flex-grow p-2.5 bg-transparent rounded-r-lg outline-none appearance-none cursor-pointer"
                >
                  <option value="">-- Sélectionner un animal --</option>
                  {pets.length > 0 ? (
                    pets.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Aucun animal disponible</option>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Sélection du vétérinaire */}
            <div>
              <label
                htmlFor="vetId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Vétérinaire <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all duration-200">
                <Stethoscope className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
                <select
                  id="vetId"
                  name="vetId"
                  value={form.vetId}
                  onChange={handleChange}
                  required
                  className="flex-grow p-2.5 bg-transparent rounded-r-lg outline-none appearance-none cursor-pointer"
                >
                  <option value="">-- Sélectionner un vétérinaire --</option>
                  {vets.length > 0 ? (
                    vets.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.username}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Aucun vétérinaire disponible</option>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Champ date et heure */}
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date et heure <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all duration-200">
                <CalendarDays className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
                <input
                  type="datetime-local"
                  id="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  className="flex-grow p-2.5 bg-transparent rounded-r-lg outline-none"
                />
              </div>
            </div>

            {/* Champ motif */}
            <div>
              <label
                htmlFor="reason"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Motif <span className="text-red-500">*</span>
              </label>
              <div className="flex items-start border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all duration-200">
                <ClipboardList className="w-5 h-5 text-gray-400 ml-3 mt-3 flex-shrink-0" />
                <textarea
                  id="reason"
                  name="reason"
                  rows={3}
                  value={form.reason}
                  onChange={handleChange}
                  placeholder="Ex: Consultation annuelle, Vaccination, Boiterie..."
                  required
                  className="flex-grow p-2.5 bg-transparent rounded-r-lg outline-none resize-y"
                />
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-between gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center justify-center gap-2 transform hover:scale-105"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                {isSubmitting ? "Création..." : "Prendre RDV"}
              </button>
              <button
                type="button"
                onClick={() => navigate('/appointments')}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center justify-center gap-2 transform hover:scale-105"
              >
                <ArrowLeft className="w-5 h-5" /> Retour
              </button>
            </div>
          </form>
        </div>
      </div>
    </LayoutNavbar>
  );
};

export default AppointmentForm;
