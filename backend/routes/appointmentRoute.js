const express = require("express");
const router = express.Router();
const { createAppointment, getAllAppointments } = require("../controllers/appointmentController");
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");

router.post("/create", authMiddleware, createAppointment);
router.get("/all", authMiddleware, checkRole(["admin", "vet"]), getAllAppointments);

module.exports = router;
