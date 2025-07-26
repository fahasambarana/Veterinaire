import { AlertCircle, CalendarDays, PawPrint, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// IMPORTANT : Vérifiez les chemins d'importation selon votre arborescence de dossiers
import DashboardCard from "../components/DashboardCard";
import LayoutSidebar from "../components/LayoutSidebar";
import ClientList from "../components/ClientList";
import Statistique from "../components/Statistique";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AdminDashboard = () => {
  const [clientCount, setClientCount] = useState(0);
  const [loadingClientCount, setLoadingClientCount] = useState(true);
  const [clientCountError, setClientCountError] = useState(null);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Function to fetch the total client count (already existing API route)
  useEffect(() => {
    const fetchClientCount = async () => {
      setLoadingClientCount(true);
      setClientCountError(null);
      const token = localStorage.getItem("token");

      if (!token) {
        setClientCountError("Authentification requise pour charger le nombre de propriétaires.");
        setLoadingClientCount(false);
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/users/countClients`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setClientCount(res.data.totalClients);
      } catch (err) {
        console.error("Erreur chargement nombre de clients :", err.response?.data || err.message);
        setClientCountError("Échec du chargement du nombre de propriétaires.");
      } finally {
        setLoadingClientCount(false);
      }
    };

    if (!authLoading && user && (user.role === "admin" || user.role === "vet")) {
      fetchClientCount();
    }
  }, [user, authLoading]);

  // Global loading for initial user authentication check
  if (authLoading) {
    return (
      <LayoutSidebar>
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-3 text-lg text-gray-600">Chargement de l'utilisateur...</p>
        </div>
      </LayoutSidebar>
    );
  }

  // Access control check
  if (!user || (user.role !== "admin" && user.role !== "vet")) {
    return (
      <LayoutSidebar>
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg text-center text-red-600 mx-auto mt-20 border border-red-200">
          <h3 className="text-2xl font-bold mb-4">Accès Refusé</h3>
          <p>Vous n'êtes pas autorisé à accéder à cette page.</p>
        </div>
      </LayoutSidebar>
    );
  }

  return (
    <LayoutSidebar>
      <div className="p-8 bg-gray-100 min-h-screen">
        <h1 className="text-4xl font-extrabold text-teal-700 mb-10 text-center">
          Tableau de bord Administrateur
        </h1>

        {clientCountError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6 shadow-md animate-fade-in-down" role="alert">
            <strong className="font-bold">Erreur :</strong>
            <span className="block sm:inline"> {clientCountError}</span>
          </div>
        )}

        {/* Section des cartes de résumé */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-14">
          <DashboardCard
            title="Total animaux"
            value="350" // Static value as per constraint
            icon={<PawPrint className="text-white w-8 h-8" />}
            bgColor="bg-gray-500"
          />
          <DashboardCard
            title="Propriétaires"
            value={loadingClientCount ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              clientCount
            )}
            icon={<Users className="text-white w-8 h-8" />}
            bgColor="bg-teal-400"
          />
          <DashboardCard
            title="Rendez-vous aujourd'hui"
            value="15" // Static value as per constraint
            icon={<CalendarDays className="text-white w-8 h-8" />}
            bgColor="bg-purple-400"
          />
          <DashboardCard
            title="Alertes urgentes"
            value="3" // Static value as per constraint
            icon={<AlertCircle className="text-white w-8 h-8" />}
            bgColor="bg-red-400"
          />
        </div>

        {/* Partie principale du tableau de bord avec le composant Statistique et la liste des clients */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10"> {/* Added mb-10 for spacing */}
          {/* Section de Statistique */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-md p-8 border border-gray-200">
            <Statistique />
          </div>

          {/* Section des Nouveaux propriétaires */}
          <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-teal-700 mb-6 text-center">Nouveaux propriétaires</h2>
            <ClientList />
          </div>
        </div>

        {/* New Block: Recent Activities / Dernières Activités */}
        <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-teal-700 mb-6 text-center">Activités Récentes</h2>
          <div className="text-center text-gray-500 py-8 italic">
            <p className="mb-2">Cette section afficherait les activités récentes du système (ex: dernières consultations, ajouts d'animaux, etc.).</p>
            <p>Données statiques pour la démonstration.</p>
            <ul className="mt-4 list-disc list-inside space-y-2 text-left max-w-md mx-auto">
                <li>Consultation n°123 pour Max le chien - 23 Juil. 2025</li>
                <li>Nouvel animal ajouté : Whiskers le chat - 22 Juil. 2025</li>
                <li>Rendez-vous annulé par Sophie Dupont - 21 Juil. 2025</li>
            </ul>
          </div>
        </div>

      </div>
    </LayoutSidebar>
  );
};

export default AdminDashboard;