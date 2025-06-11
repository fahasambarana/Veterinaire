import { AlertCircle, CalendarDays, PawPrint, Users } from "lucide-react";
import React from "react";
// IMPORTANT : Les erreurs "Could not resolve" que vous rencontrez indiquent que les chemins d'importation ci-dessous sont incorrects.
// VEUILLEZ VÉRIFIER L'ARBORESCENCE DE VOS DOSSIERS et AJUSTER CES CHEMINS EN CONSÉQUENCE.
//
// Par exemple :
// Si AdminDashboard.jsx est dans 'src/pages/'
// et DashboardCard est dans 'src/components/'
// alors '../components/DashboardCard' est le bon chemin.
//
// Si LayoutSidebar est dans le MÊME DOSSIER que AdminDashboard.jsx (ex: 'src/pages/'),
// alors './LayoutSidebar' est le bon chemin.
//
// Si votre structure est différente (ex: 'src/layouts/LayoutSidebar'), vous devrez le modifier.

import DashboardCard from "../components/DashboardCard"; // Vérifiez ce chemin
import LayoutSidebar from "./LayoutSidebar"; // Vérifiez ce chemin
import ClientList from "./ClientList"; // Vérifiez ce chemin
import { useEffect, useState } from "react";
import axios from "axios";

// Importe le composant Statistique
import Statistique from "./Statistique"; // Vérifiez ce chemin

const AdminDashboard = () => {
  const [clientCount, setClientCount] = useState(0);

  // Fonction pour récupérer le nombre total de clients
  useEffect(() => {
    const fetchClientCount = async () => {
      const token = localStorage.getItem("token"); // Récupère le token d'authentification
      try {
        const res = await axios.get("http://localhost:5000/api/users/countClients", {
          headers: {
            Authorization: `Bearer ${token}`, // Ajoute le token aux en-têtes
          },
        });
        setClientCount(res.data.totalClients); // Met à jour le nombre de clients
      } catch (err) {
        console.error("Erreur chargement nombre de clients :", err);
      }
    };

    fetchClientCount(); // Appelle la fonction au montage du composant
  }, []); // Le tableau de dépendances vide assure que l'appel ne se fait qu'une fois

  return (
    <LayoutSidebar>
      <div className="p-8"> {/* Ajout d'un padding pour un meilleur espacement */}

        {/* Titre principal du tableau de bord */}
        <h1 className="text-4xl font-extrabold text-teal-700 mb-10 text-center">
          Tableau de bord Administrateur
        </h1>

        {/* Section des cartes de résumé */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-14">
          <DashboardCard
            title="Total animaux"
            value="350" // Valeur statique, vous pourriez vouloir la rendre dynamique
            icon={<PawPrint className="text-white w-8 h-8" />}
            bgColor="bg-gray-500"
          />
          <DashboardCard
            title="Propriétaires"
            value={clientCount} // Affiche le nombre de clients récupéré
            icon={<Users className="text-white w-8 h-8" />}
            bgColor="bg-teal-400"
          />
          <DashboardCard
            title="Rendez-vous aujourd'hui"
            value="15" // Valeur statique, vous pourriez vouloir la rendre dynamique
            icon={<CalendarDays className="text-white w-8 h-8" />}
            bgColor="bg-purple-400"
          />
          <DashboardCard
            title="Alertes urgentes"
            value="3" // Valeur statique, vous pourriez vouloir la rendre dynamique
            icon={<AlertCircle className="text-white w-8 h-8" />}
            bgColor="bg-red-400"
          />
        </div>

        {/* Partie principale du tableau de bord avec le composant Statistique et la liste des clients */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Section de Statistique */}
          <div className="md:col-span-2 bg-white rounded-2xl z-10 shadow-md p-8">
            {/* Le composant Statistique est maintenant affiché ici. */}
            <Statistique />
          </div>

          {/* Section des Derniers propriétaires */}
          <div className="bg-white rounded-2xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-teal-700 mb-6 text-center">Nouveaux propriétaires</h2>
            <ClientList /> {/* Affiche la liste des clients */}
          </div>

        </div>

      </div>
    </LayoutSidebar>
  );
};

export default AdminDashboard;
