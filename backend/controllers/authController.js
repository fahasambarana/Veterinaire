const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");

// Register
exports.register = async (req, res) => {
  try {
    const { username, email, password, role, phone } = req.body;
    // console.log("Requête register :", req.body);


    const user = await User.create({ username, email, password, role, phone });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET, // Assure-toi qu’il est bien défini dans .env
      { expiresIn: "1d" }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    // console.log("Requête register :", req.body);


    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Mot de passe ou email incorrect" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
