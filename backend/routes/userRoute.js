const express = require("express");
const router = express.Router();
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");
const { getAllClients, countClients,getAllVets } = require("../controllers/userController");

router.get("/clients", authMiddleware, checkRole(["admin", "vet"]), getAllClients);
router.get("/vets", authMiddleware, checkRole(["admin", "pet-owner", "vet"]), getAllVets);
router.get("/countClients", authMiddleware, countClients);

module.exports = router;
console.log("authMiddleware:", authMiddleware);
console.log("checkRole:", checkRole);
console.log("getAllClients:", getAllClients);

