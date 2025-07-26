// src/components/ConsultationForm.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import LayoutSidebar from "../components/LayoutSidebar"; // Assuming you have a LayoutSidebar component
import {
  Weight,
  Thermometer,
  Stethoscope, // Changed from Microscope for diagnosis, more fitting
  FileText, // For notes
  Pill, // For treatment
  CalendarDays, // For prefill date display
  Info, // For prefill reason display
  PawPrint, // For pet name display
  CheckCircle, // For success message
  XCircle, // For error message
  Loader2, // For loading/submitting states
  ArrowLeft, // For back button
  HeartPulse, // For symptoms
} from "lucide-react"; // Importation d'icônes Lucide

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ConsultationForm = () => {
  const { appointmentId: paramAppointmentId } = useParams(); // Get appointmentId from URL if present
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State for form fields
  const [weight, setWeight] = useState("");
  const [temperature, setTemperature] = useState("");
  const [symptoms, setSymptoms] = useState(""); // Now stores selected symptom
  const [diagnosis, setDiagnosis] = useState(""); // Now stores selected diagnosis
  const [treatment, setTreatment] = useState(""); // Now stores selected treatment
  const [notes, setNotes] = useState("");

  // State for pre-filled/essential data
  const [consultationPetId, setConsultationPetId] = useState(null);
  const [consultationVetId, setConsultationVetId] = useState(null);
  const [consultationAppointmentId, setConsultationAppointmentId] = useState(null); // Explicitly store appointment ID
  const [petName, setPetName] = useState("");
  const [prefillDate, setPrefillDate] = useState("");
  const [prefillReason, setPrefillReason] = useState("");

  // UI states
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  // Predefined options for Symptoms and Diagnosis
  const symptomsOptions = [
    { value: "", label: "Sélectionnez un symptôme" },
    { value: "toux", label: "Toux" },
    { value: "vomissements", label: "Vomissements" },
    { value: "diarrhee", label: "Diarrhée" },
    { value: "fievre", label: "Fièvre" },
    { value: "boiterie", label: "Boiterie" },
    { value: "perte_appetit", label: "Perte d'appétit" },
    { value: "allergie_cutanee", label: "Allergie cutanée" },
    { value: "difficulte_respiratoire", label: "Difficulté respiratoire" },
    { value: "douleur", label: "Douleur" },
    { value: "fatigue", label: "Fatigue" },
    { value: "autre", label: "Autre (préciser dans les notes)" },
  ];

  const diagnosisOptions = [
    { value: "", label: "Sélectionnez un diagnostic" },
    { value: "rhinite", label: "Rhinite" },
    { value: "gastro_enterite", label: "Gastro-entérite" },
    { value: "otite", label: "Otite" },
    { value: "dermatite", label: "Dermatite" },
    { value: "fracture", label: "Fracture" },
    { value: "infection_urinaire", label: "Infection urinaire" },
    { value: "parasitose_intestinale", label: "Parasitose intestinale" },
    { value: "conjonctivite", label: "Conjonctivite" },
    { value: "arthrose", label: "Arthrose" },
    { value: "obesite", label: "Obésité" },
    { value: "autre", label: "Autre (préciser dans les notes)" },
  ];

  // NEW: Predefined options for Treatment
  const treatmentOptions = [
    { value: "", label: "Sélectionnez un traitement" },
    { value: "antibiotiques", label: "Antibiotiques" },
    { value: "anti_inflammatoires", label: "Anti-inflammatoires" },
    { value: "antiparasitaires", label: "Antiparasitaires" },
    { value: "antiviraux", label: "Antiviraux" },
    { value: "analgesiques", label: "Analgésiques" },
    { value: "rehydratation", label: "Réhydratation" },
    { value: "chirurgie", label: "Chirurgie" },
    { value: "regime_alimentaire", label: "Régime alimentaire spécial" },
    { value: "physiotherapie", label: "Physiothérapie" },
    { value: "vaccination", label: "Vaccination" },
    { value: "autre", label: "Autre (préciser dans les notes)" },
  ];

  // Utility to clear messages after a timeout
  const clearMessages = useCallback((setter) => {
    setTimeout(() => setter(null), 5000); // Clear after 5 seconds
  }, []);

  useEffect(() => {
    const loadConsultationData = async () => {
      setIsLoadingDetails(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentification requise pour charger les détails.");
        setIsLoadingDetails(false);
        navigate('/login');
        return;
      }

      // Prioritize data from location.state (passed from AppointmentCalendar)
      if (location.state && location.state.appointmentId && location.state.petId && location.state.vetId) {
        setConsultationAppointmentId(location.state.appointmentId);
        setConsultationPetId(location.state.petId);
        setConsultationVetId(location.state.vetId);
        setPetName(location.state.prefillPetName || "Animal Inconnu");
        setPrefillDate(location.state.prefillDate || "");
        setPrefillReason(location.state.prefillReason || "");
        setIsLoadingDetails(false);
        return;
      }

      // If no data from state, try to fetch from API using paramAppointmentId
      if (paramAppointmentId) {
        try {
          const res = await axios.get(`${API_URL}/appointments/${paramAppointmentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const rdv = res.data;

          setConsultationAppointmentId(rdv._id);
          setConsultationPetId(rdv.petId?._id?.toString() || rdv.petId?.toString() || null);
          setConsultationVetId(rdv.vetId?._id?.toString() || rdv.vetId?.toString() || null);
          setPetName(rdv.petId?.name || "Animal Inconnu");
          setPrefillDate(new Date(rdv.date).toISOString().split('T')[0]);
          setPrefillReason(rdv.reason);

        } catch (err) {
          console.error("[ConsultationForm] Error fetching appointment details:", err.response?.data || err.message);
          setError("Impossible de charger les détails du rendez-vous. " + (err.response?.data?.message || "Vérifiez votre connexion."));
        } finally {
          setIsLoadingDetails(false);
        }
      } else {
        setError("ID du rendez-vous manquant. Impossible de charger le formulaire.");
        setIsLoadingDetails(false);
      }
    };

    loadConsultationData();
  }, [paramAppointmentId, location.state, navigate]); // Added navigate to dependencies

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const token = localStorage.getItem("token");
    if (!token) {
        setError("Authentification requise. Veuillez vous connecter.");
        setIsSubmitting(false);
        navigate('/login');
        return;
    }

    // Use the IDs from state, which are either from location.state or fetched
    const finalVetId = consultationVetId;
    const finalPetId = consultationPetId;
    const finalAppointmentId = consultationAppointmentId;


    if (!finalPetId || !finalVetId || !finalAppointmentId) {
        setError("Informations essentielles (animal, vétérinaire, rendez-vous) manquantes. Veuillez retourner à la page des rendez-vous et réessayer, ou recharger la page.");
        setIsSubmitting(false);
        return;
    }
    // Validate selected options for symptoms and diagnosis
    if (!symptoms.trim() || symptoms === "") {
        setError("Veuillez sélectionner au moins un symptôme.");
        setIsSubmitting(false);
        return;
    }
    if (!diagnosis.trim() || diagnosis === "") {
        setError("Veuillez sélectionner un diagnostic.");
        setIsSubmitting(false);
        return;
    }
    // Treatment is optional, no validation needed here for empty string

    const payload = {
      vetId: finalVetId,
      petId: finalPetId,
      appointmentId: finalAppointmentId,
      weight: weight !== "" ? parseFloat(weight) : null,
      temperature: temperature !== "" ? parseFloat(temperature) : null,
      symptoms, // Now directly the selected value
      diagnosis, // Now directly the selected value
      treatment, // Now directly the selected value
      notes,
    };

    try {
      await axios.post(
        `${API_URL}/consultations`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccessMessage("Consultation enregistrée avec succès !");
      clearMessages(setSuccessMessage);
      // Navigate to the pet's consultation list page after successful submission
      navigate(`/consultationList/${finalPetId}`);
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la consultation:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement de la consultation. Veuillez réessayer.");
      clearMessages(setError);
    } finally {
        setIsSubmitting(false);
    }
  };

  // Access control: Only vets can access this form
  if (!user || user.role !== 'vet') {
    return (
        <LayoutSidebar>
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg text-center text-red-600 mx-auto mt-20 border border-red-200 animate-fade-in-down">
                <h3 className="text-2xl font-bold mb-4">Accès Refusé</h3>
                <p>Seuls les vétérinaires peuvent enregistrer des consultations.</p>
            </div>
        </LayoutSidebar>
    );
  }

  // Loading state for initial details
  if (isLoadingDetails) {
    return (
      <LayoutSidebar>
        <div className="flex flex-col justify-center items-center min-h-[400px] text-gray-700 bg-gray-50 rounded-xl shadow-md mx-auto my-8">
          <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-3" />
          <p className="text-lg">Chargement des informations du rendez-vous...</p>
        </div>
      </LayoutSidebar>
    );
  }

  // Error state if essential IDs are missing after loading
  if (!consultationPetId || !consultationVetId || !consultationAppointmentId) {
    return (
      <LayoutSidebar>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 mx-auto mt-8 max-w-lg shadow-md animate-fade-in-down">
          <strong className="font-bold">Erreur: </strong>
          <span className="block sm:inline">{error || "Des informations essentielles (animal, vétérinaire, rendez-vous) sont manquantes."}</span>
          <p className="mt-2 text-sm">Veuillez vous assurer que le rendez-vous a bien un animal et un vétérinaire associés, ou contactez l'administrateur.</p>
          <div className="text-center mt-4">
              <button
                  onClick={() => navigate('/appointments')}
                  className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-200"
              >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux rendez-vous
              </button>
          </div>
        </div>
      </LayoutSidebar>
    );
  }

  return (
    <LayoutSidebar>
      <div className="min-h-screen p-8 bg-gray-100">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-xl w-full max-w-2xl mx-auto border border-gray-200 animate-fade-in">
          <h2 className="text-3xl font-extrabold text-teal-700 mb-8 text-center">
            Nouvelle Consultation pour <span className="text-blue-600">{petName}</span>
          </h2>

          {/* Display pre-filled appointment details */}
          <div className="bg-teal-50 border-l-4 border-teal-500 text-teal-800 p-4 mb-6 rounded-lg shadow-sm">
              <p className="font-semibold mb-2 flex items-center"><PawPrint className="w-5 h-5 mr-2" /> Animal: {petName}</p>
              <p className="flex items-center"><CalendarDays className="w-5 h-5 mr-2" /> Date du rendez-vous: {prefillDate}</p>
              <p className="flex items-center"><Info className="w-5 h-5 mr-2" /> Motif du rendez-vous: {prefillReason}</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 animate-fade-in-down">
              <strong className="font-bold">Erreur: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 animate-fade-in-down">
              <strong className="font-bold">Succès: </strong>
              <span className="block sm:inline">{successMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="relative">
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">Poids (kg)</label>
              <div className="flex items-center border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all duration-200">
                <Weight className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
                <input
                  type="number"
                  id="weight"
                  className="flex-grow p-2.5 bg-transparent rounded-r-md outline-none"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  step="0.1"
                  min="0"
                  placeholder="Ex: 15.5"
                />
              </div>
            </div>

            <div className="relative">
              <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">Température (C°)</label>
              <div className="flex items-center border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all duration-200">
                <Thermometer className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
                <input
                  type="number"
                  id="temperature"
                  className="flex-grow p-2.5 bg-transparent rounded-r-md outline-none"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  step="0.1"
                  min="0"
                  placeholder="Ex: 38.2"
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-1">Symptômes <span className="text-red-500">*</span></label>
            <div className="relative flex items-center border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all duration-200">
              <HeartPulse className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" /> {/* Icon for symptoms */}
              <select
                id="symptoms"
                className="flex-grow p-2.5 bg-transparent rounded-r-md outline-none appearance-none cursor-pointer" // appearance-none for custom arrow
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                required
              >
                {symptomsOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {/* Custom arrow for select */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-1">Diagnostic <span className="text-red-500">*</span></label>
            <div className="relative flex items-center border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all duration-200">
              <Stethoscope className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" /> {/* Icon for diagnosis */}
              <select
                id="diagnosis"
                className="flex-grow p-2.5 bg-transparent rounded-r-md outline-none appearance-none cursor-pointer"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                required
              >
                {diagnosisOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {/* Custom arrow for select */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          {/* NEW: Treatment as a select option */}
          <div className="mb-6">
            <label htmlFor="treatment" className="block text-sm font-medium text-gray-700 mb-1">Traitement</label>
            <div className="relative flex items-center border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all duration-200">
              <Pill className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
              <select
                id="treatment"
                className="flex-grow p-2.5 bg-transparent rounded-r-md outline-none appearance-none cursor-pointer"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
              >
                {treatmentOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {/* Custom arrow for select */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes supplémentaires</label>
            <div className="relative flex items-start border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all duration-200">
              <FileText className="w-5 h-5 text-gray-400 ml-3 mt-3 flex-shrink-0" />
              <textarea
                id="notes"
                className="flex-grow p-2.5 bg-transparent rounded-r-md outline-none resize-y"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                placeholder="Toute autre information pertinente..."
              />
            </div>
          </div>

          <div className="flex justify-between gap-4">
            <button
              type="submit"
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-3 rounded-md shadow-md transition duration-150 ease-in-out flex items-center justify-center gap-2 transform hover:scale-105"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {isSubmitting ? "Enregistrement..." : "Enregistrer la consultation"}
            </button>
            <button
              type="button"
              onClick={() => navigate('/appointments')} // Navigate back to appointments list
              className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold px-4 py-3 rounded-md shadow-md transition duration-150 ease-in-out flex items-center justify-center gap-2 transform hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5" /> Retour
            </button>
          </div>
        </form>
      </div>
    </LayoutSidebar>
  );
};

export default ConsultationForm;
