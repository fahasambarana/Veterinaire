// frontend/src/pages/ConsultationDetailsPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Layout from "../components/LayoutNavbar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
  const [successMessage, setSuccessMessage] = useState("");

  const [isAddingOrdonnance, setIsAddingOrdonnance] = useState(false);
  const [newOrdonnanceData, setNewOrdonnanceData] = useState({
    medicaments: [{ nom: "", dosage: "", frequence: "", duree: "", instructions: "" }],
    notesSpeciales: "",
  });
  const [addingOrdonnance, setAddingOrdonnance] = useState(false);
  const [ordonnanceError, setOrdonnanceError] = useState(null);
  const [ordonnanceSuccess, setOrdonnanceSuccess] = useState(null);


  // Fonction pour charger les détails de la consultation et ses ordonnances
  const fetchConsultationDetailsAndOrdonnances = async () => {
    if (authLoading || !user) return;

    setLoading(true);
    setError(null);
    setOrdonnanceError(null);

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
    } finally {
      setLoading(false);
    }
  };

 useEffect(() => {
    if (user) {
        console.log("Rôle de l'utilisateur connecté :", user.role);
    }
    fetchConsultationDetailsAndOrdonnances();
}, [consultationId, user, authLoading, navigate]);


  // Gérer les changements dans les champs du formulaire d'édition de la consultation
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedConsultation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Gérer la sauvegarde de la consultation
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage("");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentification requise.");
      setSaving(false);
      return;
    }

    try {
      // NOTE: `symptoms` est géré comme un tableau maintenant côté backend.
      // Si vous ajoutez un champ d'édition pour les symptômes, vous devrez transformer
      // la valeur de l'input (probablement une string séparée par des virgules)
      // en un tableau avant de l'envoyer.
      const dataToUpdate = {
        date: editedConsultation.date,
        diagnosis: editedConsultation.diagnosis,
        treatment: editedConsultation.treatment,
        notes: editedConsultation.notes,
        weight: editedConsultation.weight,
        temperature: editedConsultation.temperature,
        // Si vous avez un champ pour éditer les symptômes:
        // symptoms: editedConsultation.symptoms ? editedConsultation.symptoms.split(',').map(s => s.trim()) : [],
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
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde :", err.response?.data?.message || err.message, err);
      setError(err.response?.data?.message || "Échec de la mise à jour de la consultation.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setSaving(false);
    }
  };


  // *** Logique pour les ordonnances ***

  // Gérer les changements dans les champs d'un médicament spécifique
  const handleMedicamentChange = (index, e) => {
    const { name, value } = e.target;
    const list = [...newOrdonnanceData.medicaments];
    list[index][name] = value;
    setNewOrdonnanceData({ ...newOrdonnanceData, medicaments: list });
  };

  // Ajouter un champ de médicament vide
  const handleAddMedicament = () => {
    setNewOrdonnanceData({
      ...newOrdonnanceData,
      medicaments: [...newOrdonnanceData.medicaments, { nom: "", dosage: "", frequence: "", duree: "", instructions: "" }],
    });
  };

  // Supprimer un champ de médicament
  const handleRemoveMedicament = (index) => {
    const list = [...newOrdonnanceData.medicaments];
    list.splice(index, 1);
    setNewOrdonnanceData({ ...newOrdonnanceData, medicaments: list });
  };

  // Gérer la soumission du formulaire d'ajout d'ordonnance
  const handleAddOrdonnanceSubmit = async (e) => {
    e.preventDefault();
    setAddingOrdonnance(true);
    setOrdonnanceError(null);
    setOrdonnanceSuccess(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setOrdonnanceError("Authentification requise.");
      setAddingOrdonnance(false);
      return;
    }

    try {
      // Filtrer les médicaments vides
      const filteredMedicaments = newOrdonnanceData.medicaments.filter(
        (med) => med.nom.trim() !== ""
      );

      if (filteredMedicaments.length === 0) {
        setOrdonnanceError("Veuillez ajouter au moins un médicament.");
        setAddingOrdonnance(false);
        return;
      }

      const payload = {
        // consultationId n'est plus dans le payload si l'URL est corrigée
        medicaments: filteredMedicaments,
        notesSpeciales: newOrdonnanceData.notesSpeciales,
      };

      // CORRECTION ICI : L'URL inclut maintenant le consultationId
      await axios.post(`${API_URL}/consultations/${consultationId}/ordonnances`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setOrdonnanceSuccess("Ordonnance ajoutée avec succès !");
      setIsAddingOrdonnance(false);
      setNewOrdonnanceData({
        medicaments: [{ nom: "", dosage: "", frequence: "", duree: "", instructions: "" }],
        notesSpeciales: "",
      });
      fetchConsultationDetailsAndOrdonnances();
      setTimeout(() => setOrdonnanceSuccess(null), 3000);
    } catch (err) {
      console.error("Erreur ajout ordonnance:", err.response?.data?.message || err.message, err);
      setOrdonnanceError(err.response?.data?.message || "Échec de l'ajout de l'ordonnance.");
      setTimeout(() => setOrdonnanceError(null), 5000);
    } finally {
      setAddingOrdonnance(false);
    }
  };

  // Gérer la suppression d'une ordonnance
  const handleDeleteOrdonnance = async (ordonnanceId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette ordonnance ?")) {
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setOrdonnanceError("Authentification requise pour supprimer.");
      return;
    }

    try {
      await axios.delete(`${API_URL}/ordonnances/${ordonnanceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrdonnanceSuccess("Ordonnance supprimée avec succès.");
      fetchConsultationDetailsAndOrdonnances();
      setTimeout(() => setOrdonnanceSuccess(null), 3000);
    } catch (err) {
      console.error("Erreur suppression ordonnance:", err.response?.data?.message || err.message, err);
      setOrdonnanceError(err.response?.data?.message || "Échec de la suppression de l'ordonnance.");
      setTimeout(() => setOrdonnanceError(null), 5000);
    }
  };


  // Redirection si l'utilisateur n'est pas autorisé
  if (!user || (user.role !== "vet" && user.role !== "admin" && user.role !== "pet-owner")) {
    if (!authLoading && (!user || (user.role && !["vet", "admin", "pet-owner"].includes(user.role)))) {
      return (
        <Layout>
          <div className="bg-white p-6 rounded shadow-md w-full max-w-lg text-center text-red-600 mx-auto mt-8">
            Vous n'êtes pas autorisé à accéder à cette page de consultation.
          </div>
        </Layout>
      );
    }
    if (authLoading) {
      return (
        <Layout>
          <div className="text-center py-8 text-gray-700 mx-auto mt-8">Vérification des autorisations...</div>
        </Layout>
      );
    }
  }


  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8 text-gray-700 mx-auto mt-8">Chargement des détails de la consultation...</div>
      </Layout>
    );
  }

  if (error && !successMessage) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 mx-auto mt-8 max-w-lg">
          <strong className="font-bold">Erreur: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </Layout>
    );
  }

  if (!consultation) {
    return (
      <Layout>
        <div className="bg-white p-6 rounded-xl shadow-md mx-auto my-8 max-w-lg text-center text-gray-500">
          Consultation non trouvée.
        </div>
      </Layout>
    );
  }


  return (
   
      <div className="bg-white p-6 rounded-xl shadow-md mx-auto my-8 max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-teal-700">
            Détails de la Consultation
          </h2>
          {!isEditing && (user.role === "vet" || user.role === "admin") && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg font-semibold transition duration-200"
            >
              Modifier Consultation
            </button>
          )}
        </div>

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Succès :</strong>
            <span className="block sm:inline"> {successMessage}</span>
          </div>
        )}
        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Erreur :</strong>
                <span className="block sm:inline"> {error}</span>
            </div>
        )}

        {isEditing ? (
          // Mode d'édition de la consultation
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="date" className="block text-gray-700 text-sm font-bold mb-2">Date :</label>
              <input
                type="date"
                id="date"
                name="date"
                value={editedConsultation.date || ""}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div>
              <label htmlFor="petName" className="block text-gray-700 text-sm font-bold mb-2">Animal :</label>
              <input
                type="text"
                id="petName"
                name="petName"
                value={consultation.petId?.name || "Inconnu"}
                readOnly
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="ownerName" className="block text-gray-700 text-sm font-bold mb-2">Propriétaire :</label>
              <input
                type="text"
                id="ownerName"
                name="ownerName"
                value={consultation.petId?.ownerId?.username || "Inconnu"}
                readOnly
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="vetName" className="block text-gray-700 text-sm font-bold mb-2">Vétérinaire :</label>
              <input
                type="text"
                id="vetName"
                name="vetName"
                value={consultation.vetId?.username || "Inconnu"}
                readOnly
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="weight" className="block text-gray-700 text-sm font-bold mb-2">Poids (kg) :</label>
              <input
                type="number"
                step="0.1"
                id="weight"
                name="weight"
                value={editedConsultation.weight !== null ? editedConsultation.weight : ""}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div>
              <label htmlFor="temperature" className="block text-gray-700 text-sm font-bold mb-2">Température (°C) :</label>
              <input
                type="number"
                step="0.1"
                id="temperature"
                name="temperature"
                value={editedConsultation.temperature !== null ? editedConsultation.temperature : ""}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div>
              <label htmlFor="diagnosis" className="block text-gray-700 text-sm font-bold mb-2">Diagnostic :</label>
              <textarea
                id="diagnosis"
                name="diagnosis"
                value={editedConsultation.diagnosis || ""}
                onChange={handleChange}
                rows="4"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              ></textarea>
            </div>
            <div>
              <label htmlFor="treatment" className="block text-gray-700 text-sm font-bold mb-2">Traitement :</label>
              <textarea
                id="treatment"
                name="treatment"
                value={editedConsultation.treatment || ""}
                onChange={handleChange}
                rows="4"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              ></textarea>
            </div>
            <div>
              <label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">Notes :</label>
              <textarea
                id="notes"
                name="notes"
                value={editedConsultation.notes || ""}
                onChange={handleChange}
                rows="4"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              ></textarea>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditedConsultation({ ...consultation, date: consultation.date ? format(new Date(consultation.date), "yyyy-MM-dd") : "" });
                  setError(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition duration-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`px-6 py-2 rounded-lg font-medium transition duration-200 ${
                  saving
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-teal-600 text-white hover:bg-teal-700"
                }`}
              >
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          </form>
        ) : (
          // Mode d'affichage de la consultation
          <div className="space-y-4 text-gray-800">
            <p className="text-lg">
              <span className="font-semibold">Date :</span>{" "}
              {consultation.date
                ? format(new Date(consultation.date), "EEEE d MMMM yyyy à HH:mm", { locale: fr })
                : "N/A"}
            </p>
            <p className="text-lg">
              <span className="font-semibold">Animal :</span>{" "}
              {consultation.petId?.name || "Inconnu"} (
              {consultation.petId?.species || "Inconnu"})
            </p>
            <p className="text-lg">
              <span className="font-semibold">Propriétaire :</span>{" "}
              {consultation.petId?.ownerId?.username || "Inconnu"}
            </p>
            <p className="text-lg">
              <span className="font-semibold">Vétérinaire :</span>{" "}
              {consultation.vetId?.username || "Inconnu"}
            </p>
            <p className="text-lg">
              <span className="font-semibold">Poids :</span>{" "}
              {consultation.weight !== null ? `${consultation.weight} kg` : "N/A"}
            </p>
            <p className="text-lg">
              <span className="font-semibold">Température :</span>{" "}
              {consultation.temperature !== null ? `${consultation.temperature} °C` : "N/A"}
            </p>
            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="font-semibold text-lg mb-2">Diagnostic :</p>
              <p className="whitespace-pre-wrap">{consultation.diagnosis || "N/A"}</p>
            </div>
            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="font-semibold text-lg mb-2">Traitement :</p>
              <p className="whitespace-pre-wrap">{consultation.treatment || "N/A"}</p>
            </div>
            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="font-semibold text-lg mb-2">Notes :</p>
              <p className="whitespace-pre-wrap">{consultation.notes || "N/A"}</p>
            </div>
            {/* CORRECTION SYMPTOMS ICI */}
            {(consultation.symptoms ?? []).length > 0 && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                    <p className="font-semibold text-lg mb-2">Symptômes :</p>
                    <ul className="list-disc list-inside">
                        {(consultation.symptoms ?? []).map((s, index) => (
                            <li key={index}>{s}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Section Ordonnances */}
            <div className="mt-8 pt-8 border-t border-gray-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-teal-700">Ordonnances</h3>
                {(user.role === "vet" || user.role === "admin") && (
                  <button
                    onClick={() => setIsAddingOrdonnance(!isAddingOrdonnance)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition duration-200"
                  >
                    {isAddingOrdonnance ? "Annuler l'ajout" : "+ Ajouter une ordonnance"}
                  </button>
                )}
              </div>

              {ordonnanceSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                  <strong className="font-bold">Succès :</strong>
                  <span className="block sm:inline"> {ordonnanceSuccess}</span>
                </div>
              )}
              {ordonnanceError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                  <strong className="font-bold">Erreur :</strong>
                  <span className="block sm:inline"> {ordonnanceError}</span>
                </div>
              )}

              {/* Formulaire d'ajout d'ordonnance */}
              {isAddingOrdonnance && (
                <form onSubmit={handleAddOrdonnanceSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50 mb-6">
                  <h4 className="text-xl font-semibold text-gray-800 mb-4">Nouvelle Ordonnance</h4>

                  {newOrdonnanceData.medicaments.map((medicament, index) => (
                    <div key={index} className="border p-4 rounded-md bg-white shadow-sm mb-4">
                      <h5 className="font-semibold text-lg mb-2">Médicament #{index + 1}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor={`nom-${index}`} className="block text-gray-700 text-sm font-bold mb-1">Nom :</label>
                          <input
                            type="text"
                            id={`nom-${index}`}
                            name="nom"
                            value={medicament.nom}
                            onChange={(e) => handleMedicamentChange(index, e)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor={`dosage-${index}`} className="block text-gray-700 text-sm font-bold mb-1">Dosage :</label>
                          <input
                            type="text"
                            id={`dosage-${index}`}
                            name="dosage"
                            value={medicament.dosage}
                            onChange={(e) => handleMedicamentChange(index, e)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          />
                        </div>
                        <div>
                          <label htmlFor={`frequence-${index}`} className="block text-gray-700 text-sm font-bold mb-1">Fréquence :</label>
                          <input
                            type="text"
                            id={`frequence-${index}`}
                            name="frequence"
                            value={medicament.frequence}
                            onChange={(e) => handleMedicamentChange(index, e)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          />
                        </div>
                        <div>
                          <label htmlFor={`duree-${index}`} className="block text-gray-700 text-sm font-bold mb-1">Durée :</label>
                          <input
                            type="text"
                            id={`duree-${index}`}
                            name="duree"
                            value={medicament.duree}
                            onChange={(e) => handleMedicamentChange(index, e)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label htmlFor={`instructions-${index}`} className="block text-gray-700 text-sm font-bold mb-1">Instructions :</label>
                        <textarea
                          id={`instructions-${index}`}
                          name="instructions"
                          value={medicament.instructions}
                          onChange={(e) => handleMedicamentChange(index, e)}
                          rows="2"
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        ></textarea>
                      </div>
                      {newOrdonnanceData.medicaments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicament(index)}
                          className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Supprimer ce médicament
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddMedicament}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold transition duration-200 mr-2"
                  >
                    + Ajouter un autre médicament
                  </button>

                  <div className="mt-4">
                    <label htmlFor="notesSpeciales" className="block text-gray-700 text-sm font-bold mb-1">Notes spéciales :</label>
                    <textarea
                      id="notesSpeciales"
                      name="notesSpeciales"
                      value={newOrdonnanceData.notesSpeciales}
                      onChange={(e) => setNewOrdonnanceData({ ...newOrdonnanceData, notesSpeciales: e.target.value })}
                      rows="3"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    ></textarea>
                  </div>

                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsAddingOrdonnance(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition duration-200"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={addingOrdonnance}
                      className={`px-6 py-2 rounded-lg font-medium transition duration-200 ${
                        addingOrdonnance
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : "bg-teal-600 text-white hover:bg-teal-700"
                      }`}
                    >
                      {addingOrdonnance ? "Ajout..." : "Enregistrer l'ordonnance"}
                    </button>
                  </div>
                </form>
              )}

              {/* Liste des ordonnances existantes */}
              {ordonnances.length > 0 ? (
                <div className="space-y-6">
                  {ordonnances.map((ordonnance) => (
                    <div key={ordonnance._id} className="border p-6 rounded-lg shadow-sm bg-white">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xl font-semibold text-gray-800">
                          Ordonnance du{" "}
                          {format(new Date(ordonnance.dateEmission), "dd MMMM yyyy", { locale: fr })}
                        </h4>
                        {(user.role === "vet" || user.role === "admin") && (
                          <button
                            onClick={() => handleDeleteOrdonnance(ordonnance._id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">
                        <span className="font-semibold">Émise par :</span>{" "}
                        {ordonnance.vetId?.username || "Inconnu"}
                      </p>
                      <div className="mt-4">
                        <h5 className="font-semibold text-lg mb-2 text-teal-700">Médicaments :</h5>
                        {ordonnance.medicaments.length > 0 ? (
                          <ul className="list-disc list-inside space-y-2">
                            {ordonnance.medicaments.map((med, medIndex) => (
                              <li key={medIndex} className="bg-gray-100 p-3 rounded-md">
                                <span className="font-medium">{med.nom}</span>{" "}
                                {med.dosage && `(${med.dosage})`}
                                {med.frequence && `, ${med.frequence}`}
                                {med.duree && `, pendant ${med.duree}`}
                                {med.instructions && (
                                  <p className="text-sm text-gray-700 italic mt-1">Instructions : {med.instructions}</p>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500">Aucun médicament listé.</p>
                        )}
                      </div>
                      {ordonnance.notesSpeciales && (
                        <div className="mt-4 border-t border-gray-200 pt-4">
                          <h5 className="font-semibold text-lg mb-2 text-teal-700">Notes Spéciales :</h5>
                          <p className="whitespace-pre-wrap">{ordonnance.notesSpeciales}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Aucune ordonnance pour cette consultation.</p>
              )}
            </div>

            <div className="flex justify-end mt-6">
              {/* Le bouton "Retour" ou autre action si nécessaire */}
              <button
                onClick={() => navigate('/consultations')} // Exemple: retour à la liste des consultations
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-200"
              >
                Retour
              </button>
            </div>
          </div>
        )}
      </div>
    
  );
};

export default ConsultationDetailsPage;