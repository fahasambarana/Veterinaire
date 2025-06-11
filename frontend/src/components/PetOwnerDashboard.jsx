import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import { AlertTriangle, CalendarCheck, PawPrint, Stethoscope } from "lucide-react";
import React from "react";
import DashboardCard from "../components/DashboardCard";
import "../index.css";
import Layout from "./LayoutNavbar";
import AppointmentCalendar from "./AppointmentCalendar";

const PetOwnerDashboard = () => {
  return (
    <Layout>
      <div className="min-h-screen flex p-8 justify-center">
        <div className="w-full max-w-7xl">

          {/* Titre principal */}
          <h1 className="text-4xl font-extrabold text-teal-700 mb-10 text-center">
            Tableau de bord - Propriétaire d'animal
          </h1>

          {/* Cartes de résumé */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-14">
            <DashboardCard
              title="Rendez-vous"
              value="5"
              icon={<CalendarCheck className="text-white w-8 h-8" />}
              bgColor="bg-teal-400"
            />
            <DashboardCard
              title="Animaux suivis"
              value="120"
              icon={<PawPrint className="text-white w-8 h-8" />}
              bgColor="bg-teal-500"
            />
            <DashboardCard
              title="Traitements en cours"
              value="8"
              icon={<Stethoscope className="text-white w-8 h-8" />}
              bgColor="bg-purple-400"
            />
            <DashboardCard
              title="Alertes vaccinales"
              value="2"
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
            <AppointmentCalendar></AppointmentCalendar>
            </div>

            {/* Section Détail Animal */}
            <div className="bg-white rounded-2xl shadow-md p-8">
              <div className="flex flex-col items-center">
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
