// frontend/src/pages/PetOwnerDashboard.jsx
import {
  AlertTriangle,
  CalendarCheck,
  PawPrint,
  Stethoscope,
  Clock, // Icône pour les rendez-vous
  Info,
  ClipboardList, // Icône pour les détails des animaux
} from "lucide-react";

import DashboardCard from "../components/DashboardCard";
import "../index.css"; // Assurez-vous que Tailwind CSS est bien importé via index.css
import Layout from "./LayoutNavbar";
import AppointmentCalendar from "../components/AppointmentCalendar";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PetOwnerDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [animalCount, setAnimalCount] = useState(0);
  const [pets, setPets] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [upcomingAppointments, setUpcomingAppointments] = useState([]); // Nouveau state pour les prochains rendez-vous

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setErrorMessage("Utilisateur non authentifié.");
          return;
        }

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

        const now = new Date();
        const activeAppointments = appointmentsRes.data.filter(
          (app) => app.status !== "annulé"
        );
        setAppointments(activeAppointments);

        // Filtrer les rendez-vous futurs pour la section "Prochains Rendez-vous"
        const futureAppointments = activeAppointments.filter(
          (app) => new Date(app.date) > now
        ).sort((a, b) => new Date(a.date) - new Date(b.date)); // Trier par date

        setUpcomingAppointments(futureAppointments);

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
  }, [user, API_URL]);

  return (
    <Layout>
      <div className="min-h-screen flex p-8 justify-center bg-gray-100">
        <div className="w-full max-w-7xl">
          {/* Titre principal */}
          <h1 className="text-4xl font-extrabold text-teal-700 mb-10 text-center">
            Tableau de bord - Propriétaire d'animal
          </h1>

          {errorMessage && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-8 shadow-md"
              role="alert"
            >
              <strong className="font-bold">Erreur :</strong>
              <span className="block sm:inline"> {errorMessage}</span>
            </div>
          )}

          {/* Cartes de résumé */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-14 justify-center"> {/* Adjusted grid and added justify-center */}
            <DashboardCard
              title="Rendez-vous Actifs"
              value={appointments.length}
              icon={<CalendarCheck className="text-white w-8 h-8" />}
              bgColor="bg-teal-600"
            />
            <DashboardCard
              title="Mes Animaux"
              value={animalCount}
              icon={<PawPrint className="text-white w-8 h-8" />}
              bgColor="bg-blue-400"
            /> <DashboardCard
              title="Consultaions Aujourd'hui"
              value="8"
              icon={<ClipboardList className="text-white w-8 h-8" />}
              bgColor="bg-teal-500"
            />
            
            {/* Removed "Traitements en cours" and "Alertes vaccinales" cards */}
          </div>

          {/* Partie principale : Calendrier & Prochains Rendez-vous (colonne de gauche) + Mes Animaux (colonne de droite) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Colonne de gauche: Calendrier et Prochains Rendez-vous */}
            <div className="lg:col-span-2 space-y-10">
              {/* Section Calendrier */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-teal-700">
                    Calendrier des rendez-vous
                  </h2>
                  <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300 transform hover:scale-105 shadow-md">
                    Nouveau rendez-vous
                  </button>
                </div>
                <AppointmentCalendar appointments={appointments} />
              </div>

              {/* Section Prochains Rendez-vous */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                <h2 className="text-2xl font-bold text-teal-700 mb-6 flex items-center">
                  <Clock className="w-6 h-6 mr-3 text-blue-500" /> Prochains Rendez-vous
                </h2>
                {upcomingAppointments.length > 0 ? (
                  <ul className="space-y-4">
                    {upcomingAppointments.slice(0, 5).map((appointment) => ( // Afficher les 5 prochains
                      <li key={appointment._id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-lg text-gray-800">
                            {appointment.petId?.name || "Animal Inconnu"} -{" "}
                            {format(new Date(appointment.date), "EEEE d MMMM yyyy à HH:mm", { locale: fr })}
                          </p>
                          <p className="text-gray-600 text-sm">
                            Vétérinaire: {appointment.vetId?.username || "Non assigné"}
                          </p>
                          <p className="text-gray-600 text-sm">
                            Raison: {appointment.reason}
                          </p>
                        </div>
                        <button
                          onClick={() => alert(`Voir détails du rendez-vous ${appointment._id}`)} // Remplacez par une navigation réelle
                          className="bg-teal-100 text-teal-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-200 transition duration-200"
                        >
                          Voir Détails
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">Aucun rendez-vous à venir.</p>
                )}
              </div>
            </div>

            {/* Colonne de droite: Mes Animaux */}
            <div className="lg:col-span-1 bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-teal-700 mb-6 flex items-center">
                <PawPrint className="w-6 h-6 mr-3 text-green-500" /> Mes Animaux
              </h2>
              {pets.length > 0 ? (
                <ul className="space-y-4">
                  {pets.map((pet) => (
                    <li key={pet._id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-xl text-gray-800 flex items-center">
                          <Info className="w-5 h-5 mr-2 text-blue-400" />
                          {pet.name}
                        </h3>
                        <button
                          onClick={() => navigate(`/pets/${pet._id}`)} // Naviguer vers la page de détails de l'animal
                          className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition duration-200"
                        >
                          Voir Profil
                        </button>
                      </div>
                      <p className="text-gray-600 text-sm">Espèce: {pet.species}</p>
                      {/* <p className="text-gray-600 text-sm">Race: {pet.breed || "Non spécifiée"}</p> */}
                      <p className="text-gray-600 text-sm">Âge: {pet.age || "Non spécifié"}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">Vous n'avez pas encore enregistré d'animaux.</p>
              )}
              <div className="mt-6 text-center">
                <button
                  onClick={() => alert("Ajouter un nouvel animal")} // Remplacez par une navigation réelle
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105 shadow-md"
                >
                  + Ajouter un Animal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PetOwnerDashboard;
