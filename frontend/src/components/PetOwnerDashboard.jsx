import { AlertTriangle, CalendarCheck, PawPrint, Stethoscope } from "lucide-react";

import DashboardCard from "../components/DashboardCard";
import "../index.css";
import Layout from "./LayoutNavbar";
import AppointmentCalendar from "../components/AppointmentCalendar"; // Assurez-vous que le chemin est correct
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";


const PetOwnerDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [animalCount, setAnimalCount] = useState(0);
  const [pets, setPets] = useState([]);
  const [errorMessage, setErrorMessage] = useState(""); // Ajouté pour afficher les erreurs

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setErrorMessage("Utilisateur non authentifié.");
          return;
        }

        // Réinitialiser les erreurs avant de tenter de récupérer les données
        setErrorMessage("");

        const [petsRes, appointmentsRes] = await Promise.all([
          axios.get(`${API_URL}/api/pets/mine`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/api/appointments/mine`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setPets(petsRes.data);
        setAnimalCount(petsRes.data.length);

        // FILTRER LES RENDEZ-VOUS ANNULÉS ICI
        const activeAppointments = appointmentsRes.data.filter(
          (app) => app.status !== "annulé"
        );
        setAppointments(activeAppointments); // Mettre à jour l'état avec la liste filtrée

      } catch (err) {
        console.error("Erreur lors du chargement des données dynamiques:", err);
        setErrorMessage(
          err?.response?.data?.message ||
            "Erreur lors du chargement des données dynamiques"
        );
      }
    };
    if (user?.role === "pet-owner") {
      fetchData();
    }
  }, [user, API_URL]); // Ajout de API_URL aux dépendances

  return (
    <Layout>
      <div className="min-h-screen flex p-8 justify-center">
        <div className="w-full max-w-7xl">

          {/* Titre principal */}
          <h1 className="text-4xl font-extrabold text-teal-700 mb-10 text-center">
            Tableau de bord - Propriétaire d'animal
          </h1>

          {errorMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Erreur :</strong>
              <span className="block sm:inline"> {errorMessage}</span>
            </div>
          )}

          {/* Cartes de résumé */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-14">
            <DashboardCard
              title="Rendez-vous"
              value={appointments.length} // Cette valeur reflétera maintenant les rendez-vous filtrés
              icon={<CalendarCheck className="text-white w-8 h-8" />}
              bgColor="bg-teal-400"
            />
            <DashboardCard
              title="Animaux suivis"
              value={animalCount}
              icon={<PawPrint className="text-white w-8 h-8" />}
              bgColor="bg-teal-500"
            />
            <DashboardCard
              title="Traitements en cours"
              value="8" // Valeur statique, si elle vient de l'API, vous devrez la récupérer
              icon={<Stethoscope className="text-white w-8 h-8" />}
              bgColor="bg-purple-400"
            />
            <DashboardCard
              title="Alertes vaccinales"
              value="2" // Valeur statique, si elle vient de l'API, vous devrez la récupérer
              icon={<AlertTriangle className="text-white w-8 h-8" />}
              bgColor="bg-red-400"
            />
          </div>

          {/* Partie principale : Calendrier + Détails */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

            {/* Section Calendrier */}
            <div className="md:col-span-2 bg-white rounded-2xl shadow-md p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-teal-700">Calendrier des rendez-vous</h2>
                <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-6 rounded-lg transition">
                  Nouveau rendez-vous
                </button>
              </div>
            <AppointmentCalendar appointments={appointments} /> {/* Passer les rendez-vous filtrés au calendrier si nécessaire */}
            </div>

            {/* Section Détail Animal */}
            <div className="bg-white rounded-2xl shadow-md p-8">
              <div className="flex flex-col items-center">
                {/* Ces données sont statiques. Pour les rendre dynamiques, vous devrez
                    sélectionner un animal à afficher ou afficher le premier de la liste `pets`. */}
                <img
                  src="https://via.placeholder.com/150"
                  alt="Photo de Max"
                  className="w-32 h-32 rounded-full object-cover mb-6"
                />
                <h3 className="text-2xl font-bold text-teal-700 mb-2">Max</h3>
                <p className="text-gray-600 mb-6 text-center">
                  John Doe | 5 ans | Mâle | Beagle
                </p>
                <div className="w-full text-gray-700 mb-6">
                  <h4 className="font-semibold mb-2 text-lg">Historique médical</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>Vaccination le 15/01/2024</li>
                    <li>Traitement anti-parasitaire en cours</li>
                  </ul>
                </div>
                <div className="w-full flex flex-col space-y-3">
                  <button className="bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-semibold">
                    Ajouter un traitement
                  </button>
                  <button className="border border-teal-600 text-teal-600 py-2 rounded-lg font-semibold hover:bg-teal-50">
                    Gérer les traitements
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </Layout>
  );
};

export default PetOwnerDashboard;