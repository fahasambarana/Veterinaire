// backend/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration du stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir;

    // Définir le dossier de destination en fonction du champ de fichier
    if (file.fieldname === 'file') { // IMPORTANT: Le champ du chat est 'file', pas 'image' ou 'profilePicture'
      uploadDir = 'uploads/chat_files'; // Un dossier spécifique pour les fichiers de chat
    } else if (file.fieldname === 'image') { // Pour les images d'animaux (si vous les utilisez ailleurs)
      uploadDir = 'uploads/pets';
    } else if (file.fieldname === 'profilePicture') { // Pour les photos de profil utilisateur (si vous les utilisez ailleurs)
      uploadDir = 'uploads/profiles';
    } else {
      // Destination par défaut ou gestion d'erreur si le champ n'est pas reconnu
      uploadDir = 'uploads/misc';
      console.warn(`Champ de fichier non reconnu: ${file.fieldname}. Enregistrement dans ${uploadDir}.`);
    }

    console.log(`[Multer Debug] Tentative de création ou vérification du dossier: ${uploadDir}`);
    try {
      // Vérifier si le dossier existe, sinon le créer
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log(`[Multer Debug] Dossier créé: ${uploadDir}`);
      } else {
        console.log(`[Multer Debug] Dossier existe déjà: ${uploadDir}`);
      }
      cb(null, uploadDir); // Le dossier de destination
    } catch (err) {
      console.error(`[Multer Error] Erreur lors de la création du dossier ${uploadDir}:`, err);
      cb(new Error(`Impossible de créer le dossier de téléchargement: ${uploadDir}. Vérifiez les permissions.`), false);
    }
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalExt = path.extname(file.originalname);
    const newFileName = file.fieldname + '-' + uniqueSuffix + originalExt;
    console.log(`[Multer Debug] Nom de fichier généré: ${newFileName}`);
    cb(null, newFileName);
  }
});

// Filtre pour n'accepter que les images et les fichiers pour le chat
const fileFilter = (req, file, cb) => {
  // Pour le champ 'file' du chat, nous pourrions vouloir accepter plus que des images
  if (file.fieldname === 'file') {
    // Accepter tous les types de fichiers pour le chat, ou spécifier davantage
    // Pour l'instant, acceptons tout pour le débogage, puis affinez.
    console.log(`[Multer Debug] Fichier de chat détecté. Type MIME: ${file.mimetype}`);
    cb(null, true); // Accepter tous les types pour le champ 'file' pour le chat
  } else if (file.fieldname === 'image') { // Pour les images d'animaux
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      console.log(`[Multer Debug] Image de profil/animal acceptée: ${file.mimetype}`);
      cb(null, true); // Accepter le fichier
    } else {
      console.error(`[Multer Error] Type de fichier non supporté pour 'image': ${file.mimetype}`);
      cb(new Error("Type de fichier non supporté pour l'image. Seules les images (JPEG, JPG, PNG, GIF) sont autorisées."), false);
    }
  } else if (file.fieldname === 'profilePicture') { // Pour les photos de profil
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      console.log(`[Multer Debug] Photo de profil acceptée: ${file.mimetype}`);
      cb(null, true); // Accepter le fichier
    } else {
      console.error(`[Multer Error] Type de fichier non supporté pour 'profilePicture': ${file.mimetype}`);
      cb(new Error("Type de fichier non supporté pour la photo de profil. Seules les images (JPEG, JPG, PNG, GIF) sont autorisées."), false);
    }
  } else {
    console.warn(`[Multer Debug] Champ de fichier inconnu dans fileFilter: ${file.fieldname}. Rejeté par défaut.`);
    cb(new Error("Champ de fichier non reconnu."), false);
  }
};

// Initialisation de Multer avec la configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10 // Augmenté la limite de taille de fichier à 10MB pour le débogage
  },
  fileFilter: fileFilter
});

module.exports = upload;
