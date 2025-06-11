import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import axios from 'axios';

// Enregistrement des éléments nécessaires de Chart.js pour un graphique linéaire.
// Ceci est essentiel pour que Chart.js puisse correctement rendre le graphique.
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

/**
 * Composant Statistique :
 * Affiche un graphique linéaire montrant l'évolution du nombre de rendez-vous par mois.
 * Il récupère dynamiquement les données de rendez-vous depuis l'API.
 */
const Statistique = () => {
  // État pour stocker les données de rendez-vous agrégées par mois
  const [monthlyAppointmentData, setMonthlyAppointmentData] = useState({ labels: [], data: [] });
  // États pour gérer l'état de chargement et les erreurs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect pour récupérer les rendez-vous au montage du composant
  useEffect(() => {
    const fetchAppointments = async () => {
      const token = localStorage.getItem("token"); // Récupère le token d'authentification
      try {
        const res = await axios.get("http://localhost:5000/api/appointments/all", {
          headers: {
            Authorization: `Bearer ${token}`, // Ajoute le token pour l'authentification
          },
        });

        const appointments = res.data; // Récupère le tableau des rendez-vous

        // --- Logique pour calculer les rendez-vous par mois (ajustée pour les mois futurs) ---
        const monthlyCounts = {};
        const uniqueMonthKeys = new Set(); // Utilise un Set pour collecter les mois uniques rencontrés, y compris les futurs

        // Parcourir TOUS les rendez-vous récupérés de l'API
        appointments.forEach(appointment => {
          // Assurez-vous que 'appointment.date' est une chaîne de date valide (ISO 8601 de préférence)
          const date = new Date(appointment.date);
          if (!isNaN(date.getTime())) { // Vérifie si la date est valide
            const year = date.getFullYear();
            const month = date.getMonth() + 1; // getMonth() est basé sur 0 (janvier = 0)
            const monthKey = `${year}-${month.toString().padStart(2, '0')}`; // Clé unique pour le mois (ex: "2025-07")

            // Initialise le compteur pour ce mois si c'est la première fois, puis incrémente
            monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
            uniqueMonthKeys.add(monthKey); // Ajoute la clé du mois à l'ensemble
          }
        });

        // Convertir l'ensemble de clés de mois en un tableau et le trier pour un affichage chronologique
        const sortedMonthKeys = Array.from(uniqueMonthKeys).sort();

        // Préparer les labels (noms des mois) et les données (comptes de rendez-vous)
        const labels = sortedMonthKeys.map(key => {
          const [year, month] = key.split('-');
          // Formate le mois pour l'affichage (ex: "Juil. 2025")
          return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('fr-FR', { month: 'short', year: 'numeric' });
        });
        const dataValues = sortedMonthKeys.map(key => monthlyCounts[key]);

        // Met à jour l'état avec les données préparées pour le graphique
        setMonthlyAppointmentData({ labels, data: dataValues });
        setLoading(false); // Indique que le chargement est terminé
      } catch (err) {
        console.error("Erreur chargement des rendez-vous pour le graphique :", err);
        setError("Impossible de charger les données du graphique."); // Définit un message d'erreur
        setLoading(false); // Indique que le chargement est terminé (avec erreur)
      }
    };

    fetchAppointments(); // Appelle la fonction de récupération au montage du composant
  }, []); // Le tableau de dépendances vide signifie que cet effet s'exécute une seule fois

  // Affichage du statut de chargement ou d'erreur
  if (loading) {
    return <p className="text-center text-teal-700">Chargement des statistiques...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  // Préparation des données pour le graphique Chart.js
  const chartData = {
    labels: monthlyAppointmentData.labels, // Labels des mois sur l'axe X
    datasets: [
      {
        label: 'Nombre de Rendez-vous', // Légende de la série de données
        data: monthlyAppointmentData.data, // Données numériques des rendez-vous par mois
        borderColor: 'rgba(75, 192, 192, 1)', // Couleur de la ligne
        backgroundColor: 'rgba(75, 192, 192, 0.2)', // Couleur de l'arrière-plan sous la ligne
        fill: true, // Remplir la zone sous la ligne
        tension: 0.3, // Courbure de la ligne (0 pour une ligne droite)
      },
    ],
  };

  // Options de configuration pour le graphique Chart.js
  const chartOptions = {
    responsive: true, // Le graphique s'adapte à la taille de son conteneur
    maintainAspectRatio: false, // Permet de définir une hauteur manuellement
    plugins: {
      legend: {
        position: 'top', // Position de la légende (en haut du graphique)
      },
      title: {
        display: true, // Afficher le titre du graphique
        text: 'Évolution Mensuelle des Rendez-vous', // Texte du titre
        font: { size: 18, weight: 'bold' }, // Style du titre
        color: '#115e59', // Couleur du texte du titre (teal-800)
      },
      tooltip: {
        mode: 'index', // Mode d'affichage des info-bulles au survol (affiche toutes les données à l'index)
        intersect: false, // Les info-bulles s'affichent même si le curseur ne croise pas un point exact
      },
    },
    scales: {
      x: {
        title: {
          display: true, // Afficher le titre de l'axe X
          text: 'Mois', // Texte du titre de l'axe X
          color: '#333', // Couleur du titre
        },
      },
      y: {
        beginAtZero: true, // L'axe Y commence à zéro
        title: {
          display: true, // Afficher le titre de l'axe Y
          text: 'Nombre de Rendez-vous', // Texte du titre de l'axe Y
          color: '#333', // Couleur du titre
        },
        ticks: {
          stepSize: 1, // Assure que les ticks sur l'axe Y sont des nombres entiers
        }
      },
    },
  };

  return (
    // Conteneur du graphique avec une hauteur définie pour le rendre visible
    // Le graphique lui-même sera responsive grâce à 'maintainAspectRatio: false' et 'responsive: true'
    <div style={{ height: '400px', width: '100%' }}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default Statistique;
