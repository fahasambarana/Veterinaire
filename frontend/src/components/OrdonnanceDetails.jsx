// src/components/OrdonnanceDetails.jsx
import React, { useState, useCallback } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ClipboardList, Stethoscope, Pill, Clock, CalendarDays, BookOpen, MinusCircle, FileText, Printer, Info, XCircle } from "lucide-react";

// Import PDF library
import jsPDF from 'jspdf';
// You might need to import fonts if you want custom ones, e.g.,
// import 'jspdf-autotable'; // If you plan to use autoTable for complex tables

const OrdonnanceDetails = ({ ordonnance, user, handleDeleteOrdonnance }) => {
  const [printError, setPrintError] = useState(null); // State for print-specific errors

  // Utility to clear messages after a timeout
  const clearPrintError = useCallback(() => {
    setTimeout(() => setPrintError(null), 5000);
  }, []);

  const handlePrint = () => {
    setPrintError(null); // Clear previous errors

    const consultation = ordonnance.consultationId;
    // CORRECTION ICI : pet et owner sont des propriétés imbriquées de consultation
    const pet = consultation?.petId;
    const owner = consultation?.petId?.ownerId;
    const vet = ordonnance.vetId;

    // Check if essential data for PDF is populated and are objects (not just string IDs)
    if (
      !consultation || typeof consultation === 'string' ||
      !pet || typeof pet === 'string' ||
      !owner || typeof owner === 'string' ||
      !vet || typeof vet === 'string'
    ) {
      setPrintError("Impossible d'imprimer l'ordonnance. Les informations complètes de la consultation, de l'animal, du propriétaire ou du vétérinaire sont manquantes. Veuillez recharger la page ou vérifier les données.");
      console.error("Données manquantes pour impression (ou non populées) :", { consultation, pet, owner, vet });
      clearPrintError();
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    let yPos = 15;

    // --- Header ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(33, 150, 83); // Teal-like color
    doc.text("Clinique Vétérinaire", 105, yPos, { align: "center" });
    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text("123 Rue des Animaux, 75000 Paris", 105, yPos, { align: "center" });
    yPos += 5;
    doc.text("Tel: +33 1 23 45 67 89 | Email: contact@vetclinic.com", 105, yPos, { align: "center" });
    yPos += 15;
    doc.line(20, yPos, 190, yPos); // Horizontal line
    yPos += 10;

    // --- Ordonnance Title ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(33, 150, 83);
    doc.text("ORDONNANCE MÉDICALE", 105, yPos, { align: "center" });
    yPos += 15;

    // --- Patient and Vet Information ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Black
    doc.text("Informations sur l'animal et le propriétaire:", 20, yPos);
    yPos += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Nom de l'animal: ${pet?.name || "N/A"}`, 20, yPos);
    yPos += 5;
    doc.text(`Espèce: ${pet?.species || "N/A"}`, 20, yPos);
    yPos += 5;
    doc.text(`Propriétaire: ${owner?.username || "N/A"}`, 20, yPos);
    yPos += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Informations sur le Vétérinaire:", 20, yPos);
    yPos += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Vétérinaire: Dr. ${vet?.username || "N/A"}`, 20, yPos);
    yPos += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Détails de la Consultation:", 20, yPos);
    yPos += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Date de l'ordonnance: ${format(new Date(ordonnance.dateEmission), "dd MMMM yyyy à HH:mm", { locale: fr })}`, 20, yPos);
    yPos += 10;

    // --- Medicaments Section ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(33, 150, 83);
    doc.text("Médicaments Prescrits:", 20, yPos);
    yPos += 8;

    if (ordonnance.medicaments.length > 0) {
      ordonnance.medicaments.forEach((med, index) => {
        // Check if new page is needed for the next medication
        if (yPos + 40 > doc.internal.pageSize.height - 20) { // 40mm estimated height for one medication block
          doc.addPage();
          yPos = 20; // Reset Y position for new page
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.setTextColor(33, 150, 83);
          doc.text("Médicaments Prescrits (suite):", 20, yPos);
          yPos += 8;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`${index + 1}. ${med.nom} ${med.dosage ? `(${med.dosage})` : ''}`, 20, yPos);
        yPos += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        if (med.frequence) {
          doc.text(`   Fréquence: ${med.frequence}`, 25, yPos);
          yPos += 5;
        }
        if (med.duree) {
          doc.text(`   Durée: ${med.duree}`, 25, yPos);
          yPos += 5;
        }
        if (med.instructions) {
          // Use splitTextToSize for long instructions
          const instructionsLines = doc.splitTextToSize(`   Instructions: ${med.instructions}`, 160); // Max width 160mm
          doc.text(instructionsLines, 25, yPos);
          yPos += (instructionsLines.length * 5) + 2; // Adjust Y based on number of lines
        }
        yPos += 5; // Space after each medication
      });
    } else {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.text("Aucun médicament listé.", 20, yPos);
      yPos += 10;
    }

    // --- Special Notes ---
    if (ordonnance.notesSpeciales) {
      if (yPos + 30 > doc.internal.pageSize.height - 20) { // Check for space before adding notes
        doc.addPage();
        yPos = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(33, 150, 83);
      doc.text("Notes Spéciales:", 20, yPos);
      yPos += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const notesLines = doc.splitTextToSize(ordonnance.notesSpeciales, 170);
      doc.text(notesLines, 20, yPos);
      yPos += (notesLines.length * 5) + 10;
    }

    // --- Footer (Signature) ---
    if (yPos + 30 > doc.internal.pageSize.height - 20) { // Check for space before adding footer
      doc.addPage();
      yPos = doc.internal.pageSize.height - 40; // Position near bottom
    } else {
      yPos = doc.internal.pageSize.height - 40; // Position near bottom
    }

    doc.line(140, yPos, 190, yPos); // Signature line
    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Signature du Vétérinaire: Dr. ${vet?.username || "N/A"}`, 140, yPos, { align: "left" });
    yPos += 5;
    doc.text(`Date d'impression: ${format(new Date(), "dd/MM/yyyy")}`, 140, yPos, { align: "left" });


    doc.save(`Ordonnance_${ordonnance._id}.pdf`);
  };


  return (
    <div className="border p-6 rounded-lg shadow-sm bg-white hover:shadow-md transition duration-200">
      <style>
        {`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        `}
      </style>

      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xl font-semibold text-gray-800 flex items-center">
          <ClipboardList className="w-5 h-5 mr-2 text-teal-600" /> Ordonnance du{" "}
          {format(new Date(ordonnance.dateEmission), "dd MMMM yyyy", { locale: fr })}
        </h4>
        <div className="no-print">
          {(user.role === "vet" || user.role === "admin") && (
            <button
              onClick={() => handleDeleteOrdonnance(ordonnance._id)}
              className="inline-flex items-center bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm font-semibold transition duration-200 shadow-sm hover:shadow-md transform hover:scale-105 mr-2"
            >
              <MinusCircle className="w-4 h-4 mr-1" /> Supprimer
            </button>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded text-sm font-semibold transition duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
          >
            <Printer className="w-4 h-4 mr-1" /> Imprimer (PDF)
          </button>
        </div>
      </div>

      {printError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 animate-fade-in-down" role="alert">
          <div className="flex items-center">
            <Info className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="block sm:inline font-medium">{printError}</span>
            <button
              onClick={() => setPrintError(null)}
              className="absolute top-0 right-0 px-4 py-3 text-red-700 hover:text-red-900"
              aria-label="Close alert"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <p className="text-gray-600 mb-2 flex items-center">
        <Stethoscope className="w-4 h-4 mr-2 text-gray-500" />
        <span className="font-semibold">Émise par :</span>{" "}
        {ordonnance.vetId?.username || "Inconnu"}
      </p>
      <div className="mt-4">
        <h5 className="font-semibold text-lg mb-2 text-teal-700 flex items-center">
          <Pill className="w-5 h-5 mr-2 text-teal-600" /> Médicaments :
        </h5>
        {ordonnance.medicaments.length > 0 ? (
          <ul className="list-none space-y-3 pl-0">
            {ordonnance.medicaments.map((med, medIndex) => (
              <li key={medIndex} className="bg-gray-100 p-4 rounded-md shadow-inner border border-gray-200">
                <p className="font-semibold text-gray-900 flex items-center">
                  <Pill className="w-4 h-4 mr-2 text-blue-500" />
                  {med.nom}
                  {med.dosage && <span className="ml-2 text-sm text-gray-600">({med.dosage})</span>}
                </p>
                <div className="ml-6 mt-1 text-sm text-gray-700 space-y-1">
                  {med.frequence && <p className="flex items-center"><Clock className="w-4 h-4 mr-2 text-gray-500" /> Fréquence: {med.frequence}</p>}
                  {med.duree && <p className="flex items-center"><CalendarDays className="w-4 h-4 mr-2 text-gray-500" /> Durée: {med.duree}</p>}
                  {med.instructions && (
                    <p className="flex items-start"><BookOpen className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" /> Instructions: <span className="whitespace-pre-wrap">{med.instructions}</span></p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 ml-7">Aucun médicament listé.</p>
        )}
      </div>
      {ordonnance.notesSpeciales && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h5 className="font-semibold text-lg mb-2 text-teal-700 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-teal-600" /> Notes Spéciales :
          </h5>
          <p className="whitespace-pre-wrap ml-7">{ordonnance.notesSpeciales}</p>
        </div>
      )}
    </div>
  );
};

export default OrdonnanceDetails;
