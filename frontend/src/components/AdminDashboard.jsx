import { AlertCircle, CalendarDays, PawPrint, Users, PieChart, Loader2 as SpinnerIcon } from "lucide-react"; // Added PieChart and renamed Loader2 for clarity
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Doughnut } from 'react-chartjs-2'; // Import Doughnut chart
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'; // Import Chart.js essentials

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// IMPORTANT : Vérifiez les chemins d'importation selon votre arborescence de dossiers
import DashboardCard from "../components/DashboardCard";
import LayoutSidebar from "../components/LayoutSidebar";
import ClientList from "../components/ClientList";
import Statistique from "../components/Statistique";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AdminDashboard = () => {
  const [clientCount, setClientCount] = useState(0);
  const [totalAnimalsCount, setTotalAnimalsCount] = useState(0); // New state for total animals
  const [totalAppointmentsCount, setTotalAppointmentsCount] = useState(0); // New state for total appointments
  const [totalConsultationsCount, setTotalConsultationsCount] = useState(0); // New state for total consultations

  const [loadingClientCount, setLoadingClientCount] = useState(true);
  const [loadingTotalAnimals, setLoadingTotalAnimals] = useState(true);
  const [loadingTotalAppointments, setLoadingTotalAppointments] = useState(true);
  const [loadingTotalConsultations, setLoadingTotalConsultations] = useState(true);


  const [clientCountError, setClientCountError] = useState(null);
  const [animalsCountError, setAnimalsCountError] = useState(null);
  const [appointmentsCountError, setAppointmentsCountError] = useState(null);
  const [consultationsCountError, setConsultationsCountError] = useState(null);


  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Static data for the animal distribution chart (as requested)
  const animalData = {
    labels: ['Chiens', 'Chats', 'Oiseaux', 'Rongeurs', 'Autres'],
    datasets: [
      {
        data: [150, 120, 30, 50, 20], // Static numbers for demonstration
        backgroundColor: [
          '#065F46', // Dark Teal
          '#0D9488', // Teal
          '#2DD4BF', // Light Teal
          '#6EE7B7', // Even Lighter Teal
          '#A7F3D0', // Very Light Teal
        ],
        borderColor: [
          '#ffffff',
          '#ffffff',
          '#ffffff',
          '#ffffff',
          '#ffffff',
        ],
        borderWidth: 2,
      },
    ],
  };

  const animalChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            size: 14,
            family: 'Inter', // Use Inter font
          },
          color: '#333',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              // Display the actual value (number) in the tooltip
              label += context.parsed;
            }
            return label;
          }
        }
      }
    },
  };

  // Utility to clear messages after a timeout
  const clearErrorMessages = useCallback((setter) => {
    setTimeout(() => setter(null), 5000);
  }, []);

  // Function to fetch the total client count
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
  }, [user, authLoading, clearErrorMessages]);

  // Function to fetch total animals count
  useEffect(() => {
    const fetchTotalAnimalsCount = async () => {
      setLoadingTotalAnimals(true);
      setAnimalsCountError(null);
      const token = localStorage.getItem("token");

      if (!token) {
        setAnimalsCountError("Authentification requise pour charger le nombre total d'animaux.");
        setLoadingTotalAnimals(false);
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/pets/total/count`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTotalAnimalsCount(res.data.totalPets);
      } catch (err) {
        console.error("Erreur chargement nombre total d'animaux :", err.response?.data || err.message);
        setAnimalsCountError("Échec du chargement du nombre total d'animaux.");
      } finally {
        setLoadingTotalAnimals(false);
      }
    };

    if (!authLoading && user && (user.role === "admin" || user.role === "vet")) {
      fetchTotalAnimalsCount();
    }
  }, [user, authLoading, clearErrorMessages]);

  // Function to fetch total appointments count
  useEffect(() => {
    const fetchTotalAppointmentsCount = async () => {
      setLoadingTotalAppointments(true);
      setAppointmentsCountError(null);
      const token = localStorage.getItem("token");

      if (!token) {
        setAppointmentsCountError("Authentification requise pour charger le nombre total de rendez-vous.");
        setLoadingTotalAppointments(false);
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/appointments/all`, { // Assuming /all route returns all appointments
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTotalAppointmentsCount(res.data.length); // Count the number of appointments returned
      } catch (err) {
        console.error("Erreur chargement nombre total de rendez-vous :", err.response?.data || err.message);
        setAppointmentsCountError("Échec du chargement du nombre total de rendez-vous.");
      } finally {
        setLoadingTotalAppointments(false);
      }
    };

    if (!authLoading && user && (user.role === "admin" || user.role === "vet")) {
      fetchTotalAppointmentsCount();
    }
  }, [user, authLoading, clearErrorMessages]);

  // Function to fetch total consultations count
  useEffect(() => {
    const fetchTotalConsultationsCount = async () => {
      setLoadingTotalConsultations(true);
      setConsultationsCountError(null);
      const token = localStorage.getItem("token");

      if (!token) {
        setConsultationsCountError("Authentification requise pour charger le nombre total de consultations.");
        setLoadingTotalConsultations(false);
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/consultations/all`, { // Assuming /all route returns all consultations
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTotalConsultationsCount(res.data.length); // Count the number of consultations returned
      } catch (err) {
        console.error("Erreur chargement nombre total de consultations :", err.response?.data || err.message);
        setConsultationsCountError("Échec du chargement du nombre total de consultations.");
      } finally {
        setLoadingTotalConsultations(false);
      }
    };

    if (!authLoading && user && (user.role === "admin" || user.role === "vet")) {
      fetchTotalConsultationsCount();
    }
  }, [user, authLoading, clearErrorMessages]);


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

        {(clientCountError || animalsCountError || appointmentsCountError || consultationsCountError) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6 shadow-md animate-fade-in-down" role="alert">
            <strong className="font-bold">Erreur :</strong>
            <span className="block sm:inline">
              {clientCountError || animalsCountError || appointmentsCountError || consultationsCountError}
            </span>
          </div>
        )}

        {/* Section des cartes de résumé */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-14">
          <DashboardCard
            title="Total animaux"
            value={loadingTotalAnimals ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              totalAnimalsCount
            )}
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
            bgColor="bg-teal-500"
          />
          <DashboardCard
            title="Tous les rendez-vous"
            value={loadingTotalAppointments ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              totalAppointmentsCount
            )}
            icon={<CalendarDays className="text-white w-8 h-8" />}
            bgColor="bg-purple-500"
          />
          <DashboardCard
            title="Tous les consultations"
            value={loadingTotalConsultations ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              totalConsultationsCount
            )}
            icon={<AlertCircle className="text-white w-8 h-8" />}
            bgColor="bg-blue-500"
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

        {/* New Chart Block for Animal Distribution */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 animate-fade-in-up delay-200">
          <h2 className="text-2xl font-bold text-teal-700 mb-6 flex items-center">
            <PieChart className="w-6 h-6 mr-3 text-purple-500" /> Répartition des animaux
          </h2>
          <div className="h-80"> {/* Fixed height for the chart container */}
            <Doughnut data={animalData} options={animalChartOptions} />
          </div>
        </div>

      </div>
    </LayoutSidebar>
  );
};

export default AdminDashboard;
