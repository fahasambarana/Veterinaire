import { CalendarHeart, ClipboardList, Stethoscope, User2 } from "lucide-react";
import DashboardCard from "../components/DashboardCard";
import LayoutSidebar from "./LayoutSidebar";
import DisponibiliteCalendar from "../components/DisponibiliteCalendar";
import useAuth from "../hooks/useAuth";

const VetDashboard = () => {
  const { user } = useAuth();
  console.log("👤 user dans VetDashboard :", user);

  if (!user) {
    return (
      <LayoutSidebar>
        <div className="text-center text-gray-600 mt-20">
          Chargement du tableau de bord...
        </div>
      </LayoutSidebar>
    );
  }

  return (
    <LayoutSidebar>
      <div className="">

        {/* Titre principal */}
        <h1 className="text-4xl font-extrabold text-teal-700 mb-10 text-center">
          Tableau de bord Vétérinaire
        </h1>

        {/* Cartes de résumé */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-14">
          <DashboardCard
            title="Consultations aujourd'hui"
            value="8"
            icon={<Stethoscope className="text-white w-8 h-8" />}
            bgColor="bg-teal-600"
          />
          <DashboardCard
            title="Dossiers patients"
            value="145"
            icon={<ClipboardList className="text-white w-8 h-8" />}
            bgColor="bg-teal-400"
          />
          <DashboardCard
            title="Rendez-vous futurs"
            value="25"
            icon={<CalendarHeart className="text-white w-8 h-8" />}
            bgColor="bg-teal-500"
          />
          <DashboardCard
            title="Propriétaires suivis"
            value="110"
            icon={<User2 className="text-white w-8 h-8" />}
            bgColor="bg-pink-600"
          />
        </div>

        {/* Partie principale */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Section Calendrier */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-md p-8">
            <DisponibiliteCalendar veterinaireId={user?._id} />
          </div>

          {/* Section Derniers dossiers ajoutés */}
          <div className="bg-white rounded-2xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-teal-700 mb-6 text-center">Derniers dossiers</h2>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-center justify-between border-b pb-2">
                <span>Charlie | Labrador</span>
                <span className="text-sm text-gray-400">28/04/2025</span>
              </li>
              <li className="flex items-center justify-between border-b pb-2">
                <span>Simba | Chat Européen</span>
                <span className="text-sm text-gray-400">27/04/2025</span>
              </li>
              <li className="flex items-center justify-between border-b pb-2">
                <span>Rocky | Bouledogue</span>
                <span className="text-sm text-gray-400">26/04/2025</span>
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

export default VetDashboard;
