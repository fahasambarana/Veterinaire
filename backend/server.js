// server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/database");
const userRoute = require("./routes/userRoute");
const petRoutes = require("./routes/petRoute");
const authRoute = require("./routes/authRoute");
const appointmentRoute = require("./routes/appointmentRoute");

const app = express();

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Middleware

// Configuration de CORS

const corsOptions = {
  origin: "http://localhost:5173", // L'adresse de ton frontend
  credentials: true, // Permet d'envoyer des cookies avec les requêtes
};

app.use(cors(corsOptions));

app.use(express.json());

// Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/pets", petRoutes);
app.use("/api/appointments", appointmentRoute);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
