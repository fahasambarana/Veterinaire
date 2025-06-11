import jsPDF from "jspdf";

const PDFGenerator = ({ formData, pets, vets }) => {
  // Vérification des noms d'animal et de vétérinaire
  const petName = pets?.find((p) => String(p._id) === String(formData.petId))?.name || "Inconnu";
  const vetName = vets?.find((v) => String(v._id) === String(formData.vetId))?.username || "Inconnu";

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Confirmation de Rendez-vous", 50, 30);

    doc.setFontSize(14);
    doc.text(`Animal: ${petName}`, 20, 50);
    doc.text(`Vétérinaire: ${vetName}`, 20, 70);
    doc.text(`Date: ${formData.date || "Non spécifiée"}`, 20, 90);
    doc.text(`Motif: ${formData.reason || "Non spécifié"}`, 20, 110);

    // Ajout d'un cadre autour des infos
    doc.rect(10, 10, 180, 150);

    doc.save("rendez-vous.pdf");
  };

  console.log("ID de l'animal sélectionné :", formData.petId);
  console.log("ID du vétérinaire sélectionné :", formData.vetId);
  console.log("Nom de l'animal :", petName);
  console.log("Nom du vétérinaire :", vetName);

  return (
    <div>
      <div id="pdf-content" style={{ padding: "20px", background: "white", border: "1px solid #ddd", marginBottom: "10px" }}>
        <h2>Confirmation de Rendez-vous</h2>
        <p><strong>Animal :</strong> {petName}</p>
        <p><strong>Vétérinaire :</strong> {vetName}</p>
        <p><strong>Date :</strong> {formData.date || "Non spécifiée"}</p>
        <p><strong>Motif :</strong> {formData.reason || "Non spécifié"}</p>
      </div>

      <button
        onClick={generatePDF}
        className="bg-teal-600 text-white p-2 rounded shadow"
      >
        Télécharger PDF
      </button>
    </div>
  );
};

export default PDFGenerator;
