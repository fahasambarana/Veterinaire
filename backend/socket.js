// backend/socket.js
const { Server } = require("socket.io");

let io; // L'instance de Socket.IO

module.exports = {
  // Fonction pour initialiser le serveur Socket.IO
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: "*", // Permet à toutes les origines d'accéder (vous pouvez le restreindre à votre frontend)
        methods: ["GET", "POST"]
      }
    });

    console.log("Socket.IO server initialized.");

    // Gérer les connexions
    io.on('connection', (socket) => {
      console.log(`Un utilisateur Socket.IO s'est connecté: ${socket.id}`);
      
      // Rejoindre une salle basée sur l'ID de l'utilisateur pour un envoi ciblé
      const userId = socket.handshake.query.userId;
      if (userId) {
        socket.join(userId);
        console.log(`Socket ${socket.id} a rejoint la salle ${userId}`);
      }

      socket.on('disconnect', () => {
        console.log(`Un utilisateur Socket.IO s'est déconnecté: ${socket.id}`);
      });
    });

    return io;
  },
  
  // Fonction pour récupérer l'instance du serveur Socket.IO
  getIo: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  }
};
