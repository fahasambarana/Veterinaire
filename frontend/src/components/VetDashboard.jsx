// frontend/src/pages/VetDashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  CalendarHeart,
  ClipboardList,
  Stethoscope,
  Users, // Changed from User2 to Users for general clients/owners
  Clock, // Icône pour les rendez-vous
  FileText, // Icône pour les consultations
  Loader2, // Icône pour le chargement
  PlusCircle, // Icône pour l'état vide
} from "lucide-react";

import DashboardCard from "../components/DashboardCard";
import LayoutSidebar from "../components/LayoutSidebar"; // Adjusted path to components/
import DisponibiliteCalendar from "../components/DisponibiliteCalendar"; // Corrected import name to match the provided component name
import useAuth from "../hooks/useAuth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const VetDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // States pour les données dynamiques
  const [todayConsultationsCount, setTodayConsultationsCount] = useState(0);
  const [totalPatientsCount, setTotalPatientsCount] = useState(0); // Total des animaux suivis (tous les animaux du système pour le dashboard admin/vet)
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentConsultations, setRecentConsultations] = useState([]);
  const [totalClientsCount, setTotalClientsCount] = useState(0); // Total des propriétaires suivis

  // Utility to clear messages after a timeout
  const clearMessages = (setter) => {
    setTimeout(() => setter(null), 5000); // Clear after 5 seconds
  };

  const fetchData = useCallback(async () => {
    if (authLoading || !user) return; // Attendre que l'authentification soit prête

    setLoadingData(true);
    setErrorMessage("");

    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage("Utilisateur non authentifié. Veuillez vous reconnecter.");
      setLoadingData(false);
      clearMessages(setErrorMessage);
      return;
    }

    try {
      // --- Requêtes API pour les données du Dashboard ---

      // 1. Consultations aujourd'hui
      // Route: GET /api/consultations/all
      // Filtrage par date sera fait côté client si le backend ne le gère pas directement sur /all
      const consultationsAllRes = await axios.get(
        `${API_URL}/consultations/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const consultationsToday = consultationsAllRes.data.filter(
        (consultation) => {
          const consultDate = new Date(consultation.date || consultation.createdAt); // Use date or createdAt
          return consultDate >= today && consultDate < tomorrow;
        }
      );
      setTodayConsultationsCount(consultationsToday.length);


      // 2. Dossiers patients (total des animaux dans le système)
      // Route: GET /api/pets/total/count
      const petsCountRes = await axios.get(`${API_URL}/pets/total/count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTotalPatientsCount(petsCountRes.data.totalPets || 0);


      // 3. Rendez-vous futurs pour le vétérinaire connecté
      // Route: GET /api/appointments/mine (gère le rôle 'vet' côté backend)
      const upcomingAppointmentsRes = await axios.get(`${API_URL}/appointments/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const futureAppointments = upcomingAppointmentsRes.data.filter(
          (app) => new Date(app.date) > new Date() && app.status !== "annulé"
      ).sort((a, b) => new Date(a.date) - new Date(b.date));
      setUpcomingAppointments(futureAppointments);


      // 4. Propriétaires suivis (total des clients)
      // Route: GET /api/users/countClients
      const clientsCountRes = await axios.get(`${API_URL}/users/countClients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTotalClientsCount(clientsCountRes.data.totalClients || 0);


      // 5. Consultations récentes (les 5 dernières)
      // Route: GET /api/consultations/all
      // Tri et limite côté client
      const recentConsultationsAllRes = await axios.get(`${API_URL}/consultations/all`, {
          headers: { Authorization: `Bearer ${token}` },
      });
      const sortedRecentConsultations = recentConsultationsAllRes.data
        .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)) // Sort by date or createdAt
        .slice(0, 5); // Get top 5
      setRecentConsultations(sortedRecentConsultations);


    } catch (err) {
      console.error("Erreur lors du chargement des données du tableau de bord vétérinaire:", err.response?.data?.message || err.message, err);
      setErrorMessage(
        err.response?.data?.message || "Erreur lors du chargement des données du tableau de bord."
      );
      clearMessages(setErrorMessage);
    } finally {
      setLoadingData(false);
    }
  }, [user, authLoading]); // Dépendances pour recharger les données

  useEffect(() => {
    if (user?.role === "vet" || user?.role === "admin") {
      fetchData();
    }
  }, [fetchData, user]); // Depend on fetchData and user

  // Global loading for initial user authentication check or dashboard data
  if (authLoading || loadingData) {
    return (
      <LayoutSidebar>
        <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 text-gray-700">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mb-4" />
          <p className="text-xl font-semibold">Chargement du tableau de bord...</p>
        </div>
      </LayoutSidebar>
    );
  }

  // Access control check
  if (!user || (user.role !== "vet" && user.role !== "admin")) {
    return (
      <LayoutSidebar>
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg text-center text-red-600 mx-auto mt-20 border border-red-200 animate-fade-in-down">
          <h3 className="text-2xl font-bold mb-4">Accès Refusé</h3>
          <p>Vous n'êtes pas autorisé à accéder à ce tableau de bord.</p>
        </div>
      </LayoutSidebar>
    );
  }

  return (
    <LayoutSidebar>
      <div className="min-h-screen p-8 bg-gray-100">
        {/* Titre principal */}
        <h1 className="text-4xl font-extrabold text-teal-700 mb-10 text-center animate-fade-in-down">
          Tableau de bord Vétérinaire
        </h1>

        {errorMessage && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-8 shadow-md animate-fade-in-down"
            role="alert"
          >
            <strong className="font-bold">Erreur :</strong>
            <span className="block sm:inline"> {errorMessage}</span>
          </div>
        )}

        {/* Cartes de résumé */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-14">
          <DashboardCard
            title="Consultations aujourd'hui"
            value={todayConsultationsCount}
            icon={<Stethoscope className="text-white w-8 h-8" />}
            bgColor="bg-gradient-to-br from-teal-600 to-teal-700" // Gradient
            shadowColor="shadow-teal-500/50" // Custom shadow
            hoverEffect="hover:scale-105 hover:shadow-lg" // Enhanced hover
          />
          <DashboardCard
            title="Total patients"
            value={totalPatientsCount}
            icon={<ClipboardList className="text-white w-8 h-8" />}
            bgColor="bg-gradient-to-br from-teal-500 to-teal-600" // Gradient
            shadowColor="shadow-teal-400/50"
            hoverEffect="hover:scale-105 hover:shadow-lg"
          />
          <DashboardCard
            title="Rendez-vous futurs"
            value={upcomingAppointments.length}
            icon={<CalendarHeart className="text-white w-8 h-8" />}
            bgColor="bg-gradient-to-br from-blue-500 to-blue-600" // Gradient
            shadowColor="shadow-blue-400/50"
            hoverEffect="hover:scale-105 hover:shadow-lg"
          />
          <DashboardCard
            title="Propriétaires suivis"
            value={totalClientsCount}
            icon={<Users className="text-white w-8 h-8" />}
            bgColor="bg-gradient-to-br from-purple-500 to-purple-600" // Gradient
            shadowColor="shadow-purple-400/50"
            hoverEffect="hover:scale-105 hover:shadow-lg"
          />
        </div>

        {/* Partie principale : Calendrier (colonne de gauche) + Listes (colonne de droite) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Section Calendrier */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-xl p-6 border border-gray-200 w-full">
            <h2 className="text-2xl font-bold text-teal-700 mb-6 flex items-center border-b pb-4">
              <CalendarHeart className="w-6 h-6 mr-3 text-teal-600" /> Mon Calendrier de Disponibilités
            </h2>
            {/* The DisponibiliteCalendar component already handles its own loading state */}
            <DisponibiliteCalendar veterinaireId={user?._id} />
          </div>

          {/* Colonne de droite: Prochains Rendez-vous & Consultations Récentes */}
          {/* This column will now arrange its children in two columns on medium and large screens */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-10"> {/* Changed space-y-10 to grid grid-cols-1 md:grid-cols-2 gap-10 */}
            {/* Section Prochains Rendez-vous */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 animate-fade-in-up"> {/* Added fade-in-up */}
              <h2 className="text-2xl font-bold text-teal-700 mb-6 flex items-center">
                <Clock className="w-6 h-6 mr-3 text-blue-500" /> Prochains Rendez-vous
              </h2>
              {upcomingAppointments.length > 0 ? (
                <ul className="space-y-4">
                  {upcomingAppointments.slice(0, 5).map((appointment) => ( // Afficher les 5 prochains
                    <li key={appointment._id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition duration-200 ease-in-out transform hover:scale-[1.02]">
                      <p className="font-semibold text-lg text-gray-800">
                        <span className="text-blue-600">{appointment.petId?.name || "Animal Inconnu"}</span>
                      </p>
                      <p className="text-gray-600 text-sm">
                        Date: {format(new Date(appointment.date), "dd MMMM yyyy à HH:mm", { locale: fr })}
                      </p>
                      <p className="text-gray-600 text-sm">
                        Raison: <span className="italic">{appointment.reason}</span>
                      </p>
                      {/* Ajoutez un bouton pour voir les détails si nécessaire */}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center text-gray-500 py-4 flex flex-col items-center">
                  <PlusCircle className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="italic">Aucun rendez-vous à venir.</p>
                </div>
              )}
            </div>

            {/* Section Consultations Récentes */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 animate-fade-in-up delay-100"> {/* Added fade-in-up with delay */}
              <h2 className="text-2xl font-bold text-teal-700 mb-6 flex items-center">
                <FileText className="w-6 h-6 mr-3 text-green-500" /> Consultations Récentes
              </h2>
              {recentConsultations.length > 0 ? (
                <ul className="space-y-4">
                  {recentConsultations.map((consultation) => (
                    <li key={consultation._id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition duration-200 ease-in-out transform hover:scale-[1.02]">
                      <p className="font-semibold text-lg text-gray-800">
                        <span className="text-green-600">{consultation.petId?.name || "Animal Inconnu"}</span>
                      </p>
                      <p className="text-gray-600 text-sm">
                        Date: {format(new Date(consultation.date || consultation.createdAt), "dd MMMM yyyy", { locale: fr })}
                      </p>
                      <p className="text-gray-600 text-sm truncate">
                        Diagnostic: <span className="italic">{consultation.diagnosis || "N/A"}</span>
                      </p>
                      {/* Ajoutez un bouton pour voir les détails si nécessaire */}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center text-gray-500 py-4 flex flex-col items-center">
                  <PlusCircle className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="italic">Aucune consultation récente.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </LayoutSidebar>
  );
};

export default VetDashboard;
