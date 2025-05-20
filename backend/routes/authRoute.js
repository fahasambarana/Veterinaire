const express = require("express");
const { register, login } = require("../controllers/authController");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware"); // <-- destructure ici
const User = require("../models/userModel");

router.post("/register", register);
router.post("/login", login);

router.get("/profile", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ user });
});

module.exports = router;
