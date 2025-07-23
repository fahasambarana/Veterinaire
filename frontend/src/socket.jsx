// frontend/src/socket.js
import { io } from 'socket.io-client';

// L'URL de votre serveur backend Socket.IO (qui est la même que votre API REST)
const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'; 

// Crée et exporte l'instance de connexion Socket.IO
const socket = io(SOCKET_SERVER_URL, {
  // Optionnel : si vous utilisez un token d'authentification pour Socket.IO
  // Par exemple, vous pourriez vouloir passer le même token que pour les requêtes HTTP
  auth: {
    token: localStorage.getItem('token'), // Récupère le token JWT du localStorage
  },
  // Options CORS si nécessaires, bien que normalement gérées côté serveur
  // transports: ['websocket'], // Force WebSocket si vous avez des problèmes de polling
});

// Écoute un événement de connexion réussi (pour le débogage)
socket.on('connect', () => {
  console.log('Connecté au serveur Socket.IO avec ID:', socket.id);
});

// Écoute un événement de déconnexion (pour le débogage)
socket.on('disconnect', () => {
  console.log('Déconnecté du serveur Socket.IO');
});

// Écoute les erreurs de connexion (pour le débogage)
socket.on('connect_error', (err) => {
  console.error('Erreur de connexion Socket.IO:', err.message);
});

export default socket;