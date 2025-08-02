// backend/server.js

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
const ordonnanceRoutes = require('./routes/ordonnanceRoutes');

// Importation des routes de notification
const notificationRoutes = require('./routes/notificationRoute');
// La fonction setIoInstance a été supprimée, nous n'avons donc plus besoin de l'importer.

const app = express();
const server = http.createServer(app);

dotenv.config();
connectDB();

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"] // Ajout des méthodes PUT et DELETE pour une meilleure compatibilité
  }
});

// Passez l'instance de Socket.IO à l'application Express pour la rendre accessible partout via req.app.get('io')
// Cette méthode est plus robuste que l'utilisation d'une variable globale ou d'un setter.
app.set('io', io);

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Servir les fichiers statiques
app.use('/uploads/pets', express.static(path.join(__dirname, 'uploads', 'pets')));
app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads', 'profiles')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/pets", petRoutes);
app.use("/api/appointments", appointmentRoute);
app.use("/api/disponibilites", DispoRoute);
app.use("/api/consultations", ConsultationRoute);
app.use("/api/ordonnances", ordonnanceRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/conversations', messageRoutes);
app.use('/api/notifications', notificationRoutes);

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log(`Un utilisateur Socket.IO s'est connecté: ${socket.id}`);

  // Un événement générique 'join' pour que l'utilisateur rejoigne sa salle personnelle
  // pour les notifications (ex: notifications de consultation)
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} a rejoint la salle utilisateur ${userId}`);
  });

  // Gère les salles de conversation
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
