const jwt = require('jsonwebtoken');

// ✅ Middleware d'authentification
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou mal formé' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Vérification de présence d'un id et d'un rôle
    if (!decoded.id || !decoded.role) {
      return res.status(403).json({ error: 'Token invalide : utilisateur incomplet' });
    }

    req.user = decoded; // Ajout de l'utilisateur à la requête
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token invalide ou expiré' });
  }
};

// ✅ Middleware de vérification des rôles
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!Array.isArray(roles)) {
      return res.status(500).json({ message: 'Configuration de rôle invalide (doit être un tableau)' });
    }

    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès interdit : rôle insuffisant' });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  checkRole,
};
