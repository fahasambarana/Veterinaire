import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import LayoutSidebar from "../components/LayoutSidebar";
import OrdonnanceModal from "../components/OrdonnanceModal";
import OrdonnanceDetails from "../components/OrdonnanceDetails";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Edit,
  CalendarDays,
  PawPrint,
  User,
  Stethoscope,
  Weight,
  Thermometer,
  FileText,
  Pill,
  PlusCircle,
  MinusCircle,
  Save,
  XCircle,
  CheckCircle,
  Loader2,
  ClipboardList,
  Syringe,
  Clock,
  BookOpen,
  ArrowLeft,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Spinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
  </div>
);

const ConsultationDetailsPage = () => {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [consultation, setConsultation] = useState(null);
  const [ordonnances, setOrdonnances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedConsultation, setEditedConsultation] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const [showOrdonnanceModal, setShowOrdonnanceModal] = useState(false);
  const [newOrdonnanceForm, setNewOrdonnanceForm] = useState({
    medicaments: [{ nom: "", dosage: "", frequence: "", duree: "", instructions: "" }],
    notesSpeciales: "",
  });
  const [addingOrdonnance, setAddingOrdonnance] = useState(false);
  const [ordonnanceMessages, setOrdonnanceMessages] = useState({ error: null, success: null });
  const [medicamentErrors, setMedicamentErrors] = useState({});

  const clearMessages = useCallback((setter, type = 'general') => {
    setTimeout(() => {
      if (type === 'general') {
        setter(null);
      } else if (type === 'ordonnance') {
        setter(prev => ({ ...prev, [setter]: null }));
      }
    }, 5000);
  }, []);

  const medicamentOptions = {
    nom: [
      { value: "", label: "Sélectionnez un médicament" },
      { value: "Amoxicilline", label: "Amoxicilline" },
      { value: "Metronidazole", label: "Métronidazole" },
      { value: "Prednisone", label: "Prednisone" },
      { value: "Carprofen", label: "Carprofène" },
      { value: "Furosemide", label: "Furosémide" },
      { value: "Tramadol", label: "Tramadol" },
      { value: "Gabapentin", label: "Gabapentine" },
      { value: "Atopica", label: "Atopica" },
      { value: "Frontline", label: "Frontline" },
      { value: "Stronghold", label: "Stronghold" },
      { value: "Autre", label: "Autre (préciser dans les instructions)" },
    ],
    dosage: [
      { value: "", label: "Sélectionnez un dosage" },
      { value: "5mg", label: "5 mg" },
      { value: "10mg", label: "10 mg" },
      { value: "20mg", label: "20 mg" },
      { value: "50mg", label: "50 mg" },
      { value: "100mg", label: "100 mg" },
      { value: "250mg", label: "250 mg" },
      { value: "500mg", label: "500 mg" },
      { value: "1ml", label: "1 ml" },
      { value: "2.5ml", label: "2.5 ml" },
      { value: "5ml", label: "5 ml" },
      { value: "10ml", label: "10 ml" },
      { value: "Autre", label: "Autre" },
    ],
    frequence: [
      { value: "", label: "Sélectionnez une fréquence" },
      { value: "1 fois par jour", label: "1 fois par jour" },
      { value: "2 fois par jour", label: "2 fois par jour" },
      { value: "3 fois par jour", label: "3 fois par jour" },
      { value: "Tous les 2 jours", label: "Tous les 2 jours" },
      { value: "Une fois par semaine", label: "Une fois par semaine" },
      { value: "Selon besoin", label: "Selon besoin" },
      { value: "Autre", label: "Autre" },
    ],
    duree: [
      { value: "", label: "Sélectionnez une durée" },
      { value: "3 jours", label: "3 jours" },
      { value: "5 jours", label: "5 jours" },
      { value: "7 jours", label: "7 jours" },
      { value: "10 jours", label: "10 jours" },
      { value: "14 jours", label: "14 jours" },
      { value: "21 jours", label: "21 jours" },
      { value: "1 mois", label: "1 mois" },
      { value: "À vie", label: "À vie" },
      { value: "Autre", label: "Autre" },
    ],
  };

  const fetchConsultationDetailsAndOrdonnances = useCallback(async () => {
    if (authLoading || !user) return;

    setLoading(true);
    setError(null);
    setOrdonnanceMessages({ error: null, success: null });

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentification requise. Veuillez vous connecter.");
      setLoading(false);
      navigate("/login");
      return;
    }

    try {
      const consultationRes = await axios.get(`${API_URL}/consultations/${consultationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConsultation(consultationRes.data);
      const formattedDate = consultationRes.data.date ? format(new Date(consultationRes.data.date), "yyyy-MM-dd") : "";
      setEditedConsultation({ ...consultationRes.data, date: formattedDate });

      const ordonnancesRes = await axios.get(`${API_URL}/ordonnances/consultations/${consultationId}/ordonnances`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrdonnances(ordonnancesRes.data);

    } catch (err) {
      console.error("Erreur chargement détails consultation ou ordonnances:", err.response?.data?.message || err.message, err);
      setError(err.response?.data?.message || "Erreur lors du chargement des détails de la consultation ou des ordonnances.");
      clearMessages(setError);
    } finally {
      setLoading(false);
    }
  }, [consultationId, user, authLoading, navigate, clearMessages]);

  useEffect(() => {
    if (user) {
      fetchConsultationDetailsAndOrdonnances();
    }
  }, [fetchConsultationDetailsAndOrdonnances, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedConsultation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentification requise.");
      clearMessages(setError);
      setSaving(false);
      return;
    }

    try {
      const dataToUpdate = {
        date: editedConsultation.date,
        diagnosis: editedConsultation.diagnosis,
        treatment: editedConsultation.treatment,
        notes: editedConsultation.notes,
        weight: editedConsultation.weight !== "" ? parseFloat(editedConsultation.weight) : null,
        temperature: editedConsultation.temperature !== "" ? parseFloat(editedConsultation.temperature) : null,
        symptoms: editedConsultation.symptoms
      };

      const res = await axios.put(`${API_URL}/consultations/${consultationId}`, dataToUpdate, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setConsultation(res.data);
      const formattedDate = res.data.date ? format(new Date(res.data.date), "yyyy-MM-dd") : "";
      setEditedConsultation({ ...res.data, date: formattedDate });
      setSuccessMessage("Consultation mise à jour avec succès !");
      setIsEditing(false);
      clearMessages(setSuccessMessage);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde :", err.response?.data?.message || err.message, err);
      setError(err.response?.data?.message || "Échec de la mise à jour de la consultation.");
      clearMessages(setError);
    } finally {
      setSaving(false);
    }
  };

  const openOrdonnanceModal = () => {
    setNewOrdonnanceForm({
      medicaments: [{ nom: "", dosage: "", frequence: "", duree: "", instructions: "" }],
      notesSpeciales: "",
    });
    setMedicamentErrors({});
    setOrdonnanceMessages({ error: null, success: null });
    setShowOrdonnanceModal(true);
  };

  const closeOrdonnanceModal = () => {
    setShowOrdonnanceModal(false);
    setMedicamentErrors({});
    setOrdonnanceMessages({ error: null, success: null });
  };

  const handleMedicamentChange = useCallback((index, e) => {
    const { name, value } = e.target;
    setNewOrdonnanceForm(prevForm => {
      const updatedMedicaments = [...prevForm.medicaments];
      updatedMedicaments[index] = { ...updatedMedicaments[index], [name]: value };
      return { ...prevForm, medicaments: updatedMedicaments };
    });

    setMedicamentErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`nom-${index}`];
      return newErrors;
    });
  }, []);

  const handleAddMedicament = useCallback(() => {
    setNewOrdonnanceForm(prevForm => ({
      ...prevForm,
      medicaments: [...prevForm.medicaments, { nom: "", dosage: "", frequence: "", duree: "", instructions: "" }],
    }));
  }, []);

  const handleRemoveMedicament = useCallback((index) => {
    setNewOrdonnanceForm(prevForm => {
      const list = [...prevForm.medicaments];
      list.splice(index, 1);
      return { ...prevForm, medicaments: list };
    });
    setMedicamentErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`nom-${index}`];
      return newErrors;
    });
  }, []);

  const handleOrdonnanceNotesChange = useCallback((e) => {
    setNewOrdonnanceForm(prevForm => ({
      ...prevForm,
      notesSpeciales: e.target.value,
    }));
  }, []);

  const handleAddOrdonnanceSubmit = async (e) => {
    e.preventDefault();
    setAddingOrdonnance(true);
    setOrdonnanceMessages({ error: null, success: null });
    setMedicamentErrors({});

    const token = localStorage.getItem("token");
    if (!token) {
      setOrdonnanceMessages(prev => ({ ...prev, error: "Authentification requise." }));
      clearMessages(setOrdonnanceMessages, 'ordonnance');
      setAddingOrdonnance(false);
      return;
    }

    const errors = {};
    const filteredMedicaments = newOrdonnanceForm.medicaments.filter(
      (med, index) => {
        if (med.nom.trim() === "") {
          errors[`nom-${index}`] = "Le nom du médicament est requis.";
          return false;
        }
        return true;
      }
    );

    if (Object.keys(errors).length > 0) {
      setMedicamentErrors(errors);
      setOrdonnanceMessages(prev => ({ ...prev, error: "Veuillez corriger les erreurs dans les médicaments." }));
      clearMessages(setOrdonnanceMessages, 'ordonnance');
      setAddingOrdonnance(false);
      return;
    }

    if (filteredMedicaments.length === 0) {
      setOrdonnanceMessages(prev => ({ ...prev, error: "Veuillez ajouter au moins un médicament avec un nom." }));
      clearMessages(setOrdonnanceMessages, 'ordonnance');
      setAddingOrdonnance(false);
      return;
    }

    const payload = {
      medicaments: filteredMedicaments,
      notesSpeciales: newOrdonnanceForm.notesSpeciales,
    };

    try {
      await axios.post(`${API_URL}/ordonnances/consultations/${consultationId}/ordonnances`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setOrdonnanceMessages(prev => ({ ...prev, success: "Ordonnance ajoutée avec succès !" }));
      closeOrdonnanceModal();
      setNewOrdonnanceForm({
        medicaments: [{ nom: "", dosage: "", frequence: "", duree: "", instructions: "" }],
        notesSpeciales: "",
      });
      fetchConsultationDetailsAndOrdonnances();
      clearMessages(setOrdonnanceMessages, 'ordonnance');
    } catch (err) {
      console.error("Erreur ajout ordonnance:", err.response?.data?.message || err.message, err);
      setOrdonnanceMessages(prev => ({ ...prev, error: err.response?.data?.message || "Échec de l'ajout de l'ordonnance." }));
      clearMessages(setOrdonnanceMessages, 'ordonnance');
    } finally {
      setAddingOrdonnance(false);
    }
  };

  const handleDeleteOrdonnance = async (ordonnanceId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette ordonnance ?")) {
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setOrdonnanceMessages(prev => ({ ...prev, error: "Authentification requise pour supprimer." }));
      clearMessages(setOrdonnanceMessages, 'ordonnance');
      return;
    }

    const originalOrdonnances = [...ordonnances];
    setOrdonnances(ordonnances.filter(o => o._id !== ordonnanceId));
    setOrdonnanceMessages(prev => ({ ...prev, success: "Suppression de l'ordonnance..." }));
    clearMessages(setOrdonnanceMessages, 'ordonnance');

    try {
      await axios.delete(`${API_URL}/ordonnances/${ordonnanceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrdonnanceMessages(prev => ({ ...prev, success: "Ordonnance supprimée avec succès." }));
      clearMessages(setOrdonnanceMessages, 'ordonnance');
    } catch (err) {
      console.error("Erreur suppression ordonnance:", err.response?.data?.message || err.message, err);
      setOrdonnances(originalOrdonnances);
      setOrdonnanceMessages(prev => ({ ...prev, error: err.response?.data?.message || "Échec de la suppression de l'ordonnance." }));
      clearMessages(setOrdonnanceMessages, 'ordonnance');
    }
  };

  if (!user || (user.role !== "vet" && user.role !== "admin" && user.role !== "pet-owner")) {
    if (!authLoading && (!user || (user.role && !["vet", "admin", "pet-owner"].includes(user.role)))) {
      return (
        <LayoutSidebar>
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg text-center text-red-600 mx-auto mt-20 border border-red-200 animate-fade-in-down">
            <h3 className="text-2xl font-bold mb-4">Accès Refusé</h3>
            <p>Vous n'êtes pas autorisé à accéder à cette page de consultation.</p>
          </div>
        </LayoutSidebar>
      );
    }
    if (authLoading) {
      return (
        <LayoutSidebar>
          <div className="text-center py-8 text-gray-700 mx-auto mt-8">
            <Spinner />
            <p className="mt-2">Vérification des autorisations...</p>
          </div>
        </LayoutSidebar>
      );
    }
  }

  if (loading) {
    return (
      <LayoutSidebar>
        <div className="text-center py-8 text-gray-700 mx-auto mt-8">
          <Spinner />
          <p className="mt-2">Chargement des détails de la consultation...</p>
        </div>
      </LayoutSidebar>
    );
  }

  if (error && !successMessage) {
    return (
      <LayoutSidebar>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 mx-auto mt-8 max-w-lg animate-fade-in-down" role="alert">
          <strong className="font-bold">Erreur: </strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </LayoutSidebar>
    );
  }

  if (!consultation) {
    return (
      <LayoutSidebar>
        <div className="bg-white p-6 rounded-xl shadow-md mx-auto my-8 max-w-lg text-center text-gray-500">
          Consultation non trouvée.
        </div>
      </LayoutSidebar>
    );
  }

  return (
    <LayoutSidebar>
      <div className="min-h-screen ml-[-250px] p-8 bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-xl mx-auto max-w-5xl border border-gray-200 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-teal-700">
              Détails de la Consultation
            </h2>
            {!isEditing && (user.role === "vet" || user.role === "admin") && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg font-semibold transition duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <Edit className="w-5 h-5 mr-2" /> Modifier Consultation
              </button>
            )}
          </div>

          {/* Display consultation date immediately after the title */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-teal-700 flex items-center">
              <CalendarDays className="w-5 h-5 mr-2 text-teal-600" /> Date de la Consultation :
            </h3>
            <p className="text-lg ml-7">
              {consultation.date
                ? format(new Date(consultation.date), "EEEE d MMMM yyyy à HH:mm", { locale: fr })
                : "N/A"}
            </p>
          </div>

          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 animate-fade-in-down" role="alert">
              <strong className="font-bold">Succès :</strong>
              <span className="block sm:inline"> {successMessage}</span>
            </div>
          )}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 animate-fade-in-down" role="alert">
              <strong className="font-bold">Erreur :</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="date" className="block text-gray-700 text-sm font-bold mb-2">Date :</label>
                  <div className="flex items-center border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all duration-200">
                    <CalendarDays className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={editedConsultation.date || ""}
                      onChange={handleChange}
                      className="flex-grow p-2.5 bg-transparent rounded-r-md outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="petName" className="block text-gray-700 text-sm font-bold mb-2">Animal :</label>
                  <div className="flex items-center border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed">
                    <PawPrint className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
                    <input
                      type="text"
                      id="petName"
                      name="petName"
                      value={consultation.petId?.name || "Inconnu"}
                      readOnly
                      className="flex-grow p-2.5 bg-transparent rounded-r-md outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="ownerName" className="block text-gray-700 text-sm font-bold mb-2">Propriétaire :</label>
                  <div className="flex items-center border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed">
                    <User className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
                    <input
                      type="text"
                      id="ownerName"
                      name="ownerName"
                      value={consultation.petId?.ownerId?.username || "Inconnu"}
                      readOnly
                      className="flex-grow p-2.5 bg-transparent rounded-r-md outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="vetName" className="block text-gray-700 text-sm font-bold mb-2">Vétérinaire :</label>
                  <div className="flex items-center border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed">
                    <Stethoscope className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
                    <input
                      type="text"
                      id="vetName"
                      name="vetName"
                      value={consultation.vetId?.username || "Inconnu"}
                      readOnly
                      className="flex-grow p-2.5 bg-transparent rounded-r-md outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="weight" className="block text-gray-700 text-sm font-bold mb-2">Poids (kg) :</label>
                  <div className="flex items-center border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all duration-200">
                    <Weight className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
                    <input
                      type="number"
                      step="0.1"
                      id="weight"
                      name="weight"
                      value={editedConsultation.weight !== null ? editedConsultation.weight : ""}
                      onChange={handleChange}
                      className="flex-grow p-2.5 bg-transparent rounded-r-md outline-none"
                      placeholder="Ex: 15.5"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="temperature" className="block text-gray-700 text-sm font-bold mb-2">Température (°C) :</label>
                  <div className="flex items-center border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all duration-200">
                    <Thermometer className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
                    <input
                      type="number"
                      step="0.1"
                      id="temperature"
                      name="temperature"
                      value={editedConsultation.temperature !== null ? editedConsultation.temperature : ""}
                      onChange={handleChange}
                      className="flex-grow p-2.5 bg-transparent rounded-r-md outline-none"
                      placeholder="Ex: 38.2"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="diagnosis" className="block text-gray-700 text-sm font-bold mb-2">Diagnostic :</label>
                  <div className="flex items-start border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all duration-200">
                    <FileText className="w-5 h-5 text-gray-400 ml-3 mt-2 flex-shrink-0" />
                    <textarea
                      id="diagnosis"
                      name="diagnosis"
                      value={editedConsultation.diagnosis || ""}
                      onChange={handleChange}
                      rows="4"
                      className="flex-grow p-2.5 bg-transparent rounded-r-md outline-none resize-y"
                      required
                      placeholder="Entrez le diagnostic..."
                    ></textarea>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="treatment" className="block text-gray-700 text-sm font-bold mb-2">Traitement :</label>
                  <div className="flex items-start border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all duration-200">
                    <Pill className="w-5 h-5 text-gray-400 ml-3 mt-2 flex-shrink-0" />
                    <textarea
                      id="treatment"
                      name="treatment"
                      value={editedConsultation.treatment || ""}
                      onChange={handleChange}
                      rows="4"
                      className="flex-grow p-2.5 bg-transparent rounded-r-md outline-none resize-y"
                      placeholder="Détaillez le traitement..."
                    ></textarea>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">Notes :</label>
                  <div className="flex items-start border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all duration-200">
                    <FileText className="w-5 h-5 text-gray-400 ml-3 mt-2 flex-shrink-0" />
                    <textarea
                      id="notes"
                      name="notes"
                      value={editedConsultation.notes || ""}
                      onChange={handleChange}
                      rows="4"
                      className="flex-grow p-2.5 bg-transparent rounded-r-md outline-none resize-y"
                      placeholder="Ajoutez des notes supplémentaires..."
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedConsultation({ ...consultation, date: consultation.date ? format(new Date(consultation.date), "yyyy-MM-dd") : "" });
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="inline-flex items-center px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  <XCircle className="w-5 h-5 mr-2" /> Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`inline-flex items-center px-6 py-2 rounded-lg font-medium transition duration-200 shadow-md transform hover:scale-105 ${
                    saving
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-teal-600 text-white hover:bg-teal-700 hover:shadow-lg"
                  }`}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      <span>Sauvegarde...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" /> Sauvegarder
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5 text-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-teal-700 flex items-center border-t border-gray-200 pt-4">
                    <PawPrint className="w-5 h-5 mr-2 text-blue-600" /> Informations Animal & Propriétaire :
                  </h3>
                  <p className="text-lg ml-7">
                    <span className="font-medium">Nom :</span> {consultation.petId?.name || "Inconnu"} (
                    {consultation.petId?.species || "Espèce inconnue"})
                  </p>
                  <p className="text-lg ml-7">
                    <span className="font-medium">Propriétaire :</span> {consultation.petId?.ownerId?.username || "Inconnu"}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-teal-700 flex items-center border-t border-gray-200 pt-4">
                    <Stethoscope className="w-5 h-5 mr-2 text-green-600" /> Vétérinaire :
                  </h3>
                  <p className="text-lg ml-7">
                    {consultation.vetId?.username || "Inconnu"}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-teal-700 flex items-center border-t border-gray-200 pt-4">
                    <Weight className="w-5 h-5 mr-2 text-purple-600" /> Poids :
                  </h3>
                  <p className="text-lg ml-7">
                    {consultation.weight !== null ? `${consultation.weight} kg` : "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-teal-700 flex items-center border-t border-gray-200 pt-4">
                    <Thermometer className="w-5 h-5 mr-2 text-orange-600" /> Température :
                  </h3>
                  <p className="text-lg ml-7">
                    {consultation.temperature !== null ? `${consultation.temperature} °C` : "N/A"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-lg mb-2 text-teal-700 flex items-center border-t border-gray-200 pt-4">
                    <FileText className="w-5 h-5 mr-2 text-red-600" /> Diagnostic :
                  </h3>
                  <p className="whitespace-pre-wrap text-lg ml-7">{consultation.diagnosis || "N/A"}</p>
                </div>
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-lg mb-2 text-teal-700 flex items-center border-t border-gray-200 pt-4">
                    <Pill className="w-5 h-5 mr-2 text-yellow-600" /> Traitement :
                  </h3>
                  <p className="whitespace-pre-wrap text-lg ml-7">{consultation.treatment || "N/A"}</p>
                </div>
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-lg mb-2 text-teal-700 flex items-center border-t border-gray-200 pt-4">
                    <FileText className="w-5 h-5 mr-2 text-gray-600" /> Notes :
                  </h3>
                  <p className="whitespace-pre-wrap text-lg ml-7">{consultation.notes || "N/A"}</p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-300">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-teal-700 flex items-center">
                    <ClipboardList className="w-6 h-6 mr-3 text-teal-600" /> Ordonnances
                  </h3>
                  {(user.role === "vet" || user.role === "admin") && (
                    <button
                      onClick={openOrdonnanceModal}
                      className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      <PlusCircle className="w-5 h-5 mr-2" /> Ajouter une ordonnance
                    </button>
                  )}
                </div>

                {ordonnanceMessages.success && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 animate-fade-in-down" role="alert">
                    <strong className="font-bold">Succès :</strong>
                    <span className="block sm:inline"> {ordonnanceMessages.success}</span>
                  </div>
                )}
                {ordonnanceMessages.error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 animate-fade-in-down" role="alert">
                    <strong className="font-bold">Erreur :</strong>
                    <span className="block sm:inline"> {ordonnanceMessages.error}</span>
                  </div>
                )}

                {ordonnances.length > 0 ? (
                  <div className="space-y-6">
                    {ordonnances.map((ordonnance) => (
                      <OrdonnanceDetails
                        key={ordonnance._id}
                        ordonnance={ordonnance}
                        user={user}
                        handleDeleteOrdonnance={handleDeleteOrdonnance}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Aucune ordonnance pour cette consultation.</p>
                )}
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => navigate('/consultationList')}
                  className="inline-flex items-center px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" /> Retour
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <OrdonnanceModal
        showModal={showOrdonnanceModal}
        onClose={closeOrdonnanceModal}
        medicamentNomOptions={medicamentOptions.nom}
        medicamentDosageOptions={medicamentOptions.dosage}
        medicamentFrequenceOptions={medicamentOptions.frequence}
        medicamentDureeOptions={medicamentOptions.duree}
        newOrdonnanceData={newOrdonnanceForm}
        setNewOrdonnanceData={setNewOrdonnanceForm}
        medicamentErrors={medicamentErrors}
        handleMedicamentChange={handleMedicamentChange}
        handleOrdonnanceNotesChange={handleOrdonnanceNotesChange}
        handleAddMedicament={handleAddMedicament}
        handleRemoveMedicament={handleRemoveMedicament}
        handleAddOrdonnanceSubmit={handleAddOrdonnanceSubmit}
        addingOrdonnance={addingOrdonnance}
        ordonnanceError={ordonnanceMessages.error}
        ordonnanceSuccess={ordonnanceMessages.success}
        Spinner={Spinner}
      />
    </LayoutSidebar>
  );
};

export default ConsultationDetailsPage;