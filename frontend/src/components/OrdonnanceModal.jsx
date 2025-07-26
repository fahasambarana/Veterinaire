// src/components/OrdonnanceModal.jsx
import React from "react";
import {
  Pill,
  PlusCircle,
  MinusCircle,
  Save,
  XCircle,
  Loader2,
  Syringe,
  Clock,
  BookOpen,
  CalendarDays,
  FileText,
} from "lucide-react";

const OrdonnanceModal = ({
  showModal,
  onClose,
  medicamentNomOptions,
  medicamentDosageOptions,
  medicamentFrequenceOptions,
  medicamentDureeOptions,
  newOrdonnanceData,
  setNewOrdonnanceData,
  medicamentErrors,
  setMedicamentErrors, // Passed down to allow clearing specific medicament errors
  handleAddMedicament,
  handleRemoveMedicament,
  handleAddOrdonnanceSubmit,
  addingOrdonnance,
  ordonnanceError,
  ordonnanceSuccess,
  Spinner, // Passed down for consistency
}) => {

  // Gérer les changements dans les champs d'un médicament spécifique
  const handleMedicamentChange = (index, e) => {
    const { name, value } = e.target;
    const list = [...newOrdonnanceData.medicaments];
    list[index][name] = value;
    // FIX: Corrected typo from setNewOrordonnanceData to setNewOrdonnanceData
    setNewOrdonnanceData({ ...newOrdonnanceData, medicaments: list });

    // Clear specific medicament error when user starts typing
    setMedicamentErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`nom-${index}`];
      return newErrors;
    });
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
      {/* Added max-h-[90vh] and overflow-y-auto to make the modal content scrollable */}
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl mx-auto border border-gray-200 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h3 className="text-2xl font-bold text-teal-700">Ajouter une Nouvelle Ordonnance</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <XCircle className="w-7 h-7" />
          </button>
        </div>

        {ordonnanceSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 animate-fade-in-down" role="alert">
            <strong className="font-bold">Succès :</strong>
            <span className="block sm:inline"> {ordonnanceSuccess}</span>
          </div>
        )}
        {ordonnanceError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 animate-fade-in-down" role="alert">
            <strong className="font-bold">Erreur :</strong>
            <span className="block sm:inline"> {ordonnanceError}</span>
          </div>
        )}

        <form onSubmit={handleAddOrdonnanceSubmit} className="space-y-6">
          {newOrdonnanceData.medicaments.map((medicament, index) => (
            <div key={index} className="border p-5 rounded-lg bg-gray-50 shadow-sm mb-4 transition-all duration-300 hover:shadow-md">
              <div className="flex justify-between items-center mb-3">
                <h5 className="font-semibold text-lg text-teal-700">Médicament #{index + 1}</h5>
                {newOrdonnanceData.medicaments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMedicament(index)}
                    className="inline-flex items-center bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold transition duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                  >
                    <MinusCircle className="w-4 h-4 mr-1" /> Supprimer
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`modal-nom-${index}`} className="block text-gray-700 text-sm font-bold mb-1">Nom :</label>
                  <div className="relative flex items-center border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200">
                    <Pill className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
                    <select
                      id={`modal-nom-${index}`}
                      name="nom"
                      value={medicament.nom}
                      onChange={(e) => handleMedicamentChange(index, e)}
                      className={`flex-grow p-2.5 bg-transparent rounded-r-md outline-none appearance-none cursor-pointer ${medicamentErrors[`nom-${index}`] ? 'border-red-500' : ''}`}
                      required
                    >
                      {medicamentNomOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                  {medicamentErrors[`nom-${index}`] && (
                    <p className="text-red-500 text-xs italic mt-1">{medicamentErrors[`nom-${index}`]}</p>
                  )}
                </div>
                <div>
                  <label htmlFor={`modal-dosage-${index}`} className="block text-gray-700 text-sm font-bold mb-1">Dosage :</label>
                  <div className="relative flex items-center border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200">
                    <Syringe className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
                    <select
                      id={`modal-dosage-${index}`}
                      name="dosage"
                      value={medicament.dosage}
                      onChange={(e) => handleMedicamentChange(index, e)}
                      className="flex-grow p-2.5 bg-transparent rounded-r-md outline-none appearance-none cursor-pointer"
                    >
                      {medicamentDosageOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor={`modal-frequence-${index}`} className="block text-gray-700 text-sm font-bold mb-1">Fréquence :</label>
                  <div className="relative flex items-center border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200">
                    <Clock className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
                    <select
                      id={`modal-frequence-${index}`}
                      name="frequence"
                      value={medicament.frequence}
                      onChange={(e) => handleMedicamentChange(index, e)}
                      className="flex-grow p-2.5 bg-transparent rounded-r-md outline-none appearance-none cursor-pointer"
                    >
                      {medicamentFrequenceOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor={`modal-duree-${index}`} className="block text-gray-700 text-sm font-bold mb-1">Durée :</label>
                  <div className="relative flex items-center border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200">
                    <CalendarDays className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
                    <select
                      id={`modal-duree-${index}`}
                      name="duree"
                      value={medicament.duree}
                      onChange={(e) => handleMedicamentChange(index, e)}
                      className="flex-grow p-2.5 bg-transparent rounded-r-md outline-none appearance-none cursor-pointer"
                    >
                      {medicamentDureeOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor={`modal-instructions-${index}`} className="block text-gray-700 text-sm font-bold mb-1">Instructions :</label>
                <div className="flex items-start border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200">
                  <BookOpen className="w-5 h-5 text-gray-400 ml-3 mt-2 flex-shrink-0" />
                  <textarea
                    id={`modal-instructions-${index}`}
                    name="instructions"
                    value={medicament.instructions}
                    onChange={(e) => handleMedicamentChange(index, e)}
                    rows="2"
                    className="flex-grow p-2.5 bg-transparent rounded-r-md outline-none resize-y"
                    placeholder="Instructions spécifiques (ex: avec nourriture)"
                  ></textarea>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddMedicament}
            className="inline-flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold transition duration-200 mr-2 shadow-sm hover:shadow-md transform hover:scale-105"
          >
            <PlusCircle className="w-5 h-5 mr-2" /> Ajouter un autre médicament
          </button>

          <div className="mt-6">
            <label htmlFor="modal-notesSpeciales" className="block text-gray-700 text-sm font-bold mb-1">Notes spéciales pour l'ordonnance :</label>
            <div className="flex items-start border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all duration-200">
              <FileText className="w-5 h-5 text-gray-400 ml-3 mt-2 flex-shrink-0" />
              <textarea
                id="modal-notesSpeciales"
                name="notesSpeciales"
                value={newOrdonnanceData.notesSpeciales}
                onChange={(e) => setNewOrdonnanceData({ ...newOrdonnanceData, notesSpeciales: e.target.value })}
                rows="3"
                className="flex-grow p-2.5 bg-transparent rounded-r-md outline-none resize-y"
                placeholder="Toute note additionnelle pour l'ordonnance..."
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
            >
              <XCircle className="w-5 h-5 mr-2" /> Annuler
            </button>
            <button
              type="submit"
              disabled={addingOrdonnance}
              className={`inline-flex items-center px-6 py-2 rounded-lg font-medium transition duration-200 shadow-md transform hover:scale-105 ${
                addingOrdonnance
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-teal-600 text-white hover:bg-teal-700 hover:shadow-lg"
              }`}
            >
              {addingOrdonnance ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span>Ajout...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" /> Enregistrer l'ordonnance
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrdonnanceModal;
