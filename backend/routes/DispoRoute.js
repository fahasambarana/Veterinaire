const express = require('express');
const router = express.Router();
const {
  createDisponibilite,
  getDisponibilitesByVet,
  updateDisponibilite,
  deleteDisponibilite
} = require('../controllers/DispoController');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, checkRole(["vet"]), createDisponibilite);
router.get('/:vetId', authMiddleware, checkRole(["admin", "vet","pet-owner"]), getDisponibilitesByVet);
router.put('/:id', authMiddleware, checkRole(["vet"]), updateDisponibilite);
router.delete('/:id', authMiddleware, checkRole(["vet"]), deleteDisponibilite);

module.exports = router;
