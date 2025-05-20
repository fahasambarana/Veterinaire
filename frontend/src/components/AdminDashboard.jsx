import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import { AlertCircle, CalendarDays, PawPrint, Users } from "lucide-react";
import React from "react";
import DashboardCard from "../components/DashboardCard";
import LayoutSidebar from "./LayoutSidebar";
import ClientList from "./ClientList";
import { useEffect, useState } from "react";
import axios from "axios";


const AdminDashboard = () => {
  const [clientCount, setClientCount] = useState(0);

  useEffect(() => {
    const fetchClientCount = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get("http://localhost:5000/api/users/countClients", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setClientCount(res.data.totalClients);
      } catch (err) {
        console.error("Erreur chargement nombre de clients :", err);
      }
    };

    fetchClientCount();
  }, []);
  return (
    <LayoutSidebar>
      <div className="">

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
            value={clientCount}
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
            <ClientList></ClientList>
          </div>

        </div>

      </div>
    </LayoutSidebar>
  );
};

export default AdminDashboard;
