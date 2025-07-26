const express = require('express');
const router = express.Router();
const ordonnanceController = require('../controllers/ordonnanceController');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

// ✅ Appliquer authMiddleware à toutes les routes
router.use(authMiddleware);

/**
 * @route   POST /api/consultations/:consultationId/ordonnances
 * @desc    Créer une nouvelle ordonnance liée à une consultation
 * @access  Private (Vet, Admin)
 */
router.post(
  '/consultations/:consultationId/ordonnances',
  checkRole(['vet', 'admin']),
  ordonnanceController.createOrdonnance
);

/**
 * @route   GET /api/consultations/:consultationId/ordonnances
 * @desc    Récupérer les ordonnances d'une consultation
 * @access  Private (Vet, Admin, Pet-owner)
 */
router.get(
  '/consultations/:consultationId/ordonnances',
  checkRole(['vet', 'admin', 'pet-owner']),
  ordonnanceController.getOrdonnancesByConsultation
);

/**
 * @route   PUT /api/ordonnances/:id
 * @desc    Modifier une ordonnance
 * @access  Private (Vet, Admin)
 */
router.put(
  '/:id',
  checkRole(['vet', 'admin']),
  ordonnanceController.updateOrdonnance
);

/**
 * @route   DELETE /api/ordonnances/:id
 * @desc    Supprimer une ordonnance
 * @access  Private (Vet, Admin)
 */
router.delete(
  '/:id',
  checkRole(['vet', 'admin']),
  ordonnanceController.deleteOrdonnance
);
router.get("/ordonnances/:id", checkRole(['vet', 'admin', 'pet-owner']), ordonnanceController.getOrdonnanceById);


module.exports = router;
