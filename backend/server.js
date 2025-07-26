const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require("./config/database");
const userRoute = require("./routes/userRoute");
const petRoutes = require("./routes/petRoute");
const authRoute = require("./routes/authRoute");
const appointmentRoute = require("./routes/appointmentRoute");
const DispoRoute = require("./routes/DispoRoute");
const ConsultationRoute = require("./routes/consultationRoute");
const conversationRoutes = require('./routes/conversationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const ordonnanceRoutes = require('./routes/ordonnanceRoutes'); // Import des routes d'ordonnance

const app = express();
const server = http.createServer(app);

dotenv.config();
connectDB();

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});
app.set('io', io);

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 🚨 MODIFICATION CRUCIALE ICI : Servir les fichiers statiques de 'uploads/pets', 'uploads/profiles' et le dossier 'uploads' racine
app.use('/uploads/pets', express.static(path.join(__dirname, 'uploads', 'pets')));
app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads', 'profiles')));
// NOUVEAU: Servir le répertoire 'uploads' racine pour les fichiers de messages
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/pets", petRoutes);
app.use("/api/appointments", appointmentRoute);
app.use("/api/disponibilites", DispoRoute);
app.use("/api/consultations", ConsultationRoute);
app.use("/api/ordonnances", ordonnanceRoutes); // Ajout des routes d'ordonnance

app.use('/api/conversations', conversationRoutes);
app.use('/api/conversations', messageRoutes);

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log(`Un utilisateur Socket.IO s'est connecté: ${socket.id}`);
  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} a rejoint la conversation ${conversationId}`);
  });

  socket.on('leaveConversation', (conversationId) => {
    socket.leave(conversationId);
    console.log(`Socket ${socket.id} a quitté la conversation ${conversationId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Un utilisateur Socket.IO s'est déconnecté: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
