// src/components/ConsultationForm.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import { useParams, useLocation, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ConsultationForm = () => {
  const { appointmentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [weight, setWeight] = useState("");
  const [temperature, setTemperature] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  const [consultationPetId, setConsultationPetId] = useState(null);
  const [consultationVetId, setConsultationVetId] = useState(null);
  const [petName, setPetName] = useState("");


  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      if (!appointmentId) {
        setError("ID du rendez-vous manquant dans l'URL.");
        setIsLoadingDetails(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentification requise pour charger les détails du rendez-vous.");
        setIsLoadingDetails(false);
        navigate('/login');
        return;
      }

      try {
        console.log(`[ConsultationForm] Attempting to fetch appointment details for ID: ${appointmentId}`); // LOG
        const res = await axios.get(`${API_URL}/appointments/${appointmentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const rdv = res.data;

        console.log("[ConsultationForm] Backend API Response (rdv):", rdv); // LOG
        console.log("[ConsultationForm] rdv.petId from API:", rdv.petId); // LOG
        console.log("[ConsultationForm] rdv.vetId from API:", rdv.vetId); // LOG


        setConsultationPetId(rdv.petId?._id?.toString() || rdv.petId?.toString() || null);
        setConsultationVetId(rdv.vetId?._id?.toString() || rdv.vetId?.toString() || null); // <-- VERIFIER QUE C'EST BIEN 'rdv'
        setPetName(rdv.petId?.name || "Animal Inconnu");
      } catch (err) {
        console.error("[ConsultationForm] Error fetching appointment details:", err.response?.data || err.message); // LOG
        setError("Impossible de charger les détails du rendez-vous. " + (err.response?.data?.message || "Vérifiez votre connexion ou contactez l'administrateur."));
      } finally {
        setIsLoadingDetails(false);
        console.log("[ConsultationForm] Finished loading details. isLoadingDetails:", false); // LOG
      }
    };

    if (location.state && location.state.petId && location.state.vetId) {
      console.log("[ConsultationForm] Using data from location.state:", location.state); // LOG
      setConsultationPetId(location.state.petId);
      setConsultationVetId(location.state.vetId);
      setPetName(location.state.petName || "Animal Inconnu");
      setIsLoadingDetails(false);
    } else {
      console.log("[ConsultationForm] No complete data in location.state. Fetching from API."); // LOG
      fetchAppointmentDetails();
    }
  }, [appointmentId, location.state, navigate]);

  useEffect(() => {
      console.log("[ConsultationForm] Current state for rendering:", {
          consultationPetId,
          consultationVetId,
          appointmentId,
          isLoadingDetails,
          error,
          userRole: user?.role
      });
  }, [consultationPetId, consultationVetId, appointmentId, isLoadingDetails, error, user]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const token = localStorage.getItem("token");
    if (!token) {
        setError("Authentification requise. Veuillez vous connecter.");
        setIsSubmitting(false);
        navigate('/login');
        return;
    }

    const currentVetId = consultationVetId || user?.id;
    const currentPetId = consultationPetId;

    console.log("[ConsultationForm] Submitting with:", { currentPetId, currentVetId, appointmentId }); // LOG for submit

    if (!currentPetId || !currentVetId || !appointmentId) {
        setError("Informations essentielles (animal, vétérinaire, rendez-vous) manquantes. Veuillez retourner à la page des rendez-vous et réessayer, ou recharger la page.");
        setIsSubmitting(false);
        return;
    }
    if (!diagnosis.trim()) {
        setError("Le champ 'Diagnostic' est obligatoire.");
        setIsSubmitting(false);
        return;
    }

    const payload = {
      vetId: currentVetId,
      petId: currentPetId,
      appointmentId,
      weight: weight !== "" ? parseFloat(weight) : null,
      temperature: temperature !== "" ? parseFloat(temperature) : null,
      symptoms,
      diagnosis,
      treatment,
      notes,
    };

    try {
      const API_URL_CONSULTATIONS = `${API_URL}/consultations`;
      console.log("Tentative d'envoi vers l'URL :", API_URL_CONSULTATIONS, "avec payload:", payload);

      await axios.post(
        API_URL_CONSULTATIONS,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Consultation enregistrée avec succès !");
      navigate('/appointments');

    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la consultation:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement de la consultation. Veuillez réessayer.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (user && user.role !== 'vet') {
    return (
        <div className="bg-white p-6 rounded shadow-md w-full max-w-lg text-center text-red-600 mx-auto mt-8">
            Seuls les vétérinaires peuvent enregistrer des consultations.
        </div>
    );
  }

  if (isLoadingDetails) {
    return (
      <div className="text-center py-8 text-gray-700 mx-auto mt-8">
        Chargement des informations du rendez-vous...
      </div>
    );
  }

  if (error && (!consultationPetId || !consultationVetId || !appointmentId)) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 mx-auto mt-8 max-w-lg">
        <strong className="font-bold">Erreur: </strong>
        <span className="block sm:inline">{error}</span>
        <p className="mt-2 text-sm">Veuillez retourner à la page des rendez-vous et réessayer, ou vérifier votre connexion.</p>
      </div>
    );
  }

  if (!consultationPetId || !consultationVetId || !appointmentId) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 mx-auto mt-8 max-w-lg">
        <strong className="font-bold">Erreur: </strong>
        <span className="block sm:inline">Des informations essentielles sur l'animal ou le vétérinaire sont manquantes après le chargement.</span>
        <p className="mt-2 text-sm">Veuillez vous assurer que le rendez-vous a bien un animal et un vétérinaire associés, ou contactez l'administrateur.</p>
      </div>
    );
  }


  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-center mb-4 text-teal-700">
        Formulaire de Consultation pour {petName}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Erreur: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">Poids (kg)</label>
        <input
          type="number"
          id="weight"
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          step="0.1"
          min="0"
          placeholder="Ex: 15.5"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">Température (C°)</label>
        <input
          type="number"
          id="temperature"
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          step="0.1"
          min="0"
          placeholder="Ex: 38.2"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-1">Symptômes</label>
        <textarea
          id="symptoms"
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          rows="3"
          placeholder="Décrivez les symptômes observés..."
        />
      </div>

      <div className="mb-4">
        <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-1">Diagnostic <span className="text-red-500">*</span></label>
        <textarea
          id="diagnosis"
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          rows="3"
          placeholder="Quel est le diagnostic ?"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="treatment" className="block text-sm font-medium text-gray-700 mb-1">Traitement</label>
        <textarea
          id="treatment"
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          value={treatment}
          onChange={(e) => setTreatment(e.target.value)}
          rows="3"
          placeholder="Détaillez le traitement prescrit..."
        />
      </div>

      <div className="mb-6">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes supplémentaires</label>
        <textarea
          id="notes"
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows="3"
          placeholder="Toute autre information pertinente..."
        />
      </div>

      <button
        type="submit"
        className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-md shadow-sm transition duration-150 ease-in-out"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Enregistrement..." : "Enregistrer la consultation"}
      </button>
    </form>
  );
};

export default ConsultationForm;