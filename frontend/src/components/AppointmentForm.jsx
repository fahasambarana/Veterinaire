import React, { useState, useEffect } from "react";
import axios from "axios";
import PDFGenerator from "./PDFGenerator";
import LayoutNavbar from "./LayoutNavbar";
import {useNavigate} from "react-router-dom";

const AppointmentForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    petId: "",
    vetId: "",
    date: "",
    reason: "",
  });

  const [pets, setPets] = useState([]);
  const navigate = useNavigate();
  const [vets, setVets] = useState([]);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [isSuccess, setIsSuccess] = useState(false);
  const [savedFormData, setSavedFormData] = useState(null); // Stocke les données avant PDF

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setNotification({
        message: "Vous n'êtes pas authentifié.",
        type: "error",
      });
      return;
    }

    const fetchData = async () => {
      try {
        const petsRes = await axios.get("http://localhost:5000/api/pets/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPets(petsRes.data);

        const vetsRes = await axios.get(
          "http://localhost:5000/api/users/vets",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setVets(vetsRes.data);
      } catch (err) {
        console.error("Erreur chargement données :", err.message);
        setNotification({
          message: "Échec du chargement des données.",
          type: "error",
        });
      }
    };

    fetchData();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification({ message: "", type: "" });

    if (!token) {
      setNotification({
        message: "Vous n'êtes pas authentifié.",
        type: "error",
      });
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/appointments/create",
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Stocke les données actuelles avant la réinitialisation
      setSavedFormData({ ...form });

      setIsSuccess(true);
      onSuccess && onSuccess();

      setNotification({
        message: "✅ Rendez-vous créé avec succès !",
        type: "success",
      });
      setForm({ petId: "", vetId: "", date: "", reason: "" });

      console.log("RDV créé :", res.data);
    } catch (err) {
      console.error("Erreur création RDV :", err.response?.data || err.message);
      setNotification({
        message: `❌ Échec de la création du rendez-vous : ${
          err.response?.data?.message || err.message
        }`,
        type: "error",
      });
    }

    setTimeout(() => {
      setNotification({ message: "", type: "" });
      navigate("/appointments"); // Redirige vers la liste des RDV après 2 secondes

    }, 2000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));

  };

  return (
    <LayoutNavbar>
      <div className="bg-white p-6 rounded-xl shadow-md max-w-xl mt-[3rem] mx-auto relative">
        <h2 className="text-2xl font-bold mb-6 text-teal-700 text-center">
          Prendre un rendez-vous
        </h2>

        {notification.message && (
          <div
            className={`absolute top-4 left-1/2 -translate-x-1/2 p-3 rounded-lg shadow-lg text-white text-sm font-semibold z-50 ${
              notification.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
            role="alert"
          >
            {notification.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Sélection de l'animal */}
          <div>
            <label
              htmlFor="petId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Animal
            </label>
            <select
              id="petId"
              name="petId"
              value={form.petId}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500"
            >
              <option value="">-- Sélectionner un animal --</option>
              {pets.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sélection du vétérinaire */}
          <div>
            <label
              htmlFor="vetId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Vétérinaire
            </label>
            <select
              id="vetId"
              name="vetId"
              value={form.vetId}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500"
            >
              <option value="">-- Sélectionner un vétérinaire --</option>
              {vets.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.username}
                </option>
              ))}
            </select>
          </div>

          {/* Champ date et heure */}
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date et heure
            </label>
            <input
              type="datetime-local"
              id="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Champ motif */}
          <div>
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Motif
            </label>
            <textarea
              id="reason"
              name="reason"
              rows={3}
              value={form.reason}
              onChange={handleChange}
              placeholder="Ex: Consultation, Vaccination..."
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Bouton de soumission */}
          <div className="text-right">
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-6 rounded-lg shadow"
            >
              Prendre RDV
            </button>
          </div>
        </form>

        {/* Génération du PDF après succès
        {isSuccess && savedFormData && (
          <PDFGenerator formData={savedFormData} pets={pets} vets={vets} />
        )} */}
      </div>
    </LayoutNavbar>
  );
};

export default AppointmentForm;
