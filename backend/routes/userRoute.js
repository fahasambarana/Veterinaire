const express = require("express");
const router = express.Router();
const { authMiddleware, checkRole } = require("../middleware/authMiddleware");
const { getAllClients, countClients } = require("../controllers/userController");

router.get("/clients", authMiddleware, checkRole(["admin", "vet"]), getAllClients);
router.get("/countClients", authMiddleware, countClients);

module.exports = router;
console.log("authMiddleware:", authMiddleware);
console.log("checkRole:", checkRole);
console.log("getAllClients:", getAllClients);

