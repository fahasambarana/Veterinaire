import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import { AlertCircle, CalendarDays, PawPrint, Users } from "lucide-react";
import React from "react";
import DashboardCard from "../components/DashboardCard";
import LayoutSidebar from "./LayoutSidebar";

const AdminDashboard = () => {
  return (
    <LayoutSidebar>
      <div className="ml-[200px]  w-5/6">

        {/* Titre principal */}
        <h1 className="text-4xl font-extrabold text-teal-700 mb-10 text-center">
          Tableau de bord Administrateur
        </h1>

        {/* Cartes de résumé */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-14">
          <DashboardCard
            title="Total animaux"
            value="350"
            icon={<PawPrint className="text-white w-8 h-8" />}
            bgColor="bg-gray-500"
          />
          <DashboardCard
            title="Propriétaires"
            value="120"
            icon={<Users className="text-white w-8 h-8" />}
            bgColor="bg-teal-400"
          />
          <DashboardCard
            title="Rendez-vous aujourd'hui"
            value="15"
            icon={<CalendarDays className="text-white w-8 h-8" />}
            bgColor="bg-purple-400"
          />
          <DashboardCard
            title="Alertes urgentes"
            value="3"
            icon={<AlertCircle className="text-white w-8 h-8" />}
            bgColor="bg-red-400"
          />
        </div>

        {/* Partie principale */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Section Calendrier */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-md p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-teal-700">Calendrier général</h2>
              <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-6 rounded-lg transition">
                Ajouter un événement
              </button>
            </div>
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              editable
              selectable
              events={[
                { title: "Visite annuelle - Bella", date: "2025-05-01" },
                { title: "Vaccination collective", date: "2025-05-03" },
              ]}
              height="auto"
              headerToolbar={{
                start: "prev,next today",
                center: "title",
                end: "",
              }}
            />
          </div>

          {/* Section Derniers propriétaires */}
          <div className="bg-white rounded-2xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-teal-700 mb-6 text-center">Nouveaux propriétaires</h2>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-center justify-between border-b pb-2">
                <span>Sarah Dupont</span>
                <span className="text-sm text-gray-400">27/04/2025</span>
              </li>
              <li className="flex items-center justify-between border-b pb-2">
                <span>Alex Martin</span>
                <span className="text-sm text-gray-400">26/04/2025</span>
              </li>
              <li className="flex items-center justify-between border-b pb-2">
                <span>Laura Petit</span>
                <span className="text-sm text-gray-400">25/04/2025</span>
              </li>
            </ul>
            <div className="flex justify-center mt-6">
              <button className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg">
                Voir tout
              </button>
            </div>
          </div>

        </div>

      </div>
    </LayoutSidebar>
  );
};

export default AdminDashboard;
