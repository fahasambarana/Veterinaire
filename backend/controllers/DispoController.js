const Disponibilite = require('../models/DisponibiliteVetModel'); // Ensure this path is correct


const handleServerError = (res, err, message) => {
  console.error(message, err); // Log the actual error for server-side debugging
  res.status(500).json({ message: 'Erreur serveur. ' + (err.message || message) });
};


exports.createDisponibilite = async (req, res) => {
  console.log('Received payload for createDisponibilite:', req.body);
  const { vetId, date_debut, date_fin, type } = req.body;

  if (!req.user) {
    return res.status(401).json({ message: 'Non authentifié.' });
  }

  if (req.user.role === 'vet' && String(req.user.id) !== String(vetId)) {
    return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez créer des disponibilités que pour vous-même.' });
  }

  if (!vetId || !date_debut || !date_fin || !type) {
    console.warn('Missing fields detected in createDisponibilite:', { vetId, date_debut, date_fin, type });
    return res.status(400).json({ message: "Champs manquants pour la création de disponibilité." });
  }

  try {
    const newDispo = new Disponibilite({ vetId, date_debut, date_fin, type });
    await newDispo.save();
    res.status(201).json(newDispo);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: `Erreur de validation: ${messages.join(', ')}` });
    }
    handleServerError(res, err, "Erreur lors de la création de la disponibilité.");
  }
};


exports.getDisponibilites = async (req, res) => {
  try {
    const dispos = await Disponibilite.find().populate('vetId', 'username email');

    // --- CRITICAL CORRECTION FOR POPULATED VETID ---
    // Map over the results to ensure vetId is the actual ID string, not the populated object
    const formattedDispos = dispos.map(dispo => ({
        ...dispo.toObject(), // Convert Mongoose document to plain JS object
        vetId: dispo.vetId ? dispo.vetId._id.toString() : null // Get the _id from the populated object
    }));
    // --- END CORRECTION ---

    res.json(formattedDispos); // Send the formatted array
  } catch (err) {
    handleServerError(res, err, "Erreur lors de la récupération de toutes les disponibilités.");
  }
};


exports.getDisponibilitesByVet = async (req, res) => {
    const { vetId } = req.params; 

    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié.' });
    }

    if (req.user.role === 'vet' && String(req.user.id) !== String(vetId)) {
        return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez consulter que vos propres disponibilités.' });
    }

    try {
        const disponibilites = await Disponibilite.find({ vetId: vetId }).populate('vetId', 'username email');
        
        // --- CRITICAL CORRECTION FOR POPULATED VETID ---
        // Map over the results to ensure vetId is the actual ID string, not the populated object
        const formattedDisponibilites = disponibilites.map(dispo => ({
            ...dispo.toObject(), // Convert Mongoose document to plain JS object
            vetId: dispo.vetId ? dispo.vetId._id.toString() : null // Get the _id from the populated object
        }));

        res.json(formattedDisponibilites); // Send the formatted array
    } catch (error) {
        handleServerError(res, error, `Erreur lors de la récupération des disponibilités pour le vétérinaire ${vetId}.`);
    }
};


exports.updateDisponibilite = async (req, res) => {
  const { id } = req.params;
  const { vetId, date_debut, date_fin, type } = req.body; 

  if (!req.user) {
    return res.status(401).json({ message: 'Non authentifié.' });
  }

  try {
    const existingDispo = await Disponibilite.findById(id);

    if (!existingDispo) {
      return res.status(404).json({ message: 'Disponibilité non trouvée.' });
    }

    if (req.user.role === 'vet' && String(existingDispo.vetId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez modifier que vos propres disponibilités.' });
    }
 
    existingDispo.date_debut = date_debut || existingDispo.date_debut;
    existingDispo.date_fin = date_fin || existingDispo.date_fin;
    existingDispo.type = type || existingDispo.type;
    

    const updatedDispo = await existingDispo.save(); 
    res.json(updatedDispo);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: `Erreur de validation: ${messages.join(', ')}` });
    }
    handleServerError(res, err, "Erreur lors de la mise à jour de la disponibilité.");
  }
};


exports.deleteDisponibilite = async (req, res) => {
  const { id } = req.params;

  if (!req.user) {
    return res.status(401).json({ message: 'Non authentifié.' });
  }

  try {
    const existingDispo = await Disponibilite.findById(id);

    if (!existingDispo) {
      return res.status(404).json({ message: 'Disponibilité non trouvée.' });
    }

    if (req.user.role === 'vet' && String(existingDispo.vetId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez supprimer que vos propres disponibilités.' });
    }

    await Disponibilite.findByIdAndDelete(id); 
    res.json({ message: 'Disponibilité supprimée avec succès.' });
  } catch (err) {
    handleServerError(res, err, "Erreur lors de la suppression de la disponibilité.");
  }
};