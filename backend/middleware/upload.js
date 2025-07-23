// backend/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration du stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir;

    // Définir le dossier de destination en fonction du champ de fichier
    if (file.fieldname === 'image') { // Pour les images d'animaux
      uploadDir = 'uploads/pets';
    } else if (file.fieldname === 'profilePicture') { // Pour les photos de profil utilisateur
      uploadDir = 'uploads/profiles';
    } else {
      // Destination par défaut ou gestion d'erreur si le champ n'est pas reconnu
      uploadDir = 'uploads/misc';
      console.warn(`Champ de fichier non reconnu: ${file.fieldname}. Enregistrement dans ${uploadDir}.`);
    }

    // Vérifier si le dossier existe, sinon le créer
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir); // Le dossier de destination
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtre pour n'accepter que les images
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true); // Accepter le fichier
  } else {
    // Rejeter le fichier et envoyer une erreur
    cb(new Error("Type de fichier non supporté. Seules les images (JPEG, JPG, PNG, GIF) sont autorisées."), false);
  }
};

// Initialisation de Multer avec la configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // Limite de taille de fichier à 5MB
  },
  fileFilter: fileFilter
});

module.exports = upload;