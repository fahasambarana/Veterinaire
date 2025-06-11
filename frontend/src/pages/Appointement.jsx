import React from "react";
// IMPORTANT : Les erreurs "Could not resolve" indiquent que les chemins d'importation ci-dessous sont incorrects.
// VEUILLEZ VÉRIFIER VOTRE ARBORESCENCE DE FICHIERS ET AJUSTER CES CHEMINS EN CONSÉQUENCE.
// Par exemple, si 'AppointmentForm' est dans 'src/components/', et 'Appointement.jsx' est dans 'src/pages/',
// le chemin '../components/AppointmentForm' est correct.
// Si votre structure est différente, vous devrez le modifier (ex: './components/AppointmentForm' ou '@/components/AppointmentForm').
import AppointmentForm from "../components/AppointmentForm";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
// import LayoutNavbar from "../components/LayoutNavbar"; // Commenté: cette importation n'est pas utilisée dans le JSX de ce composant
import useAuth from "../hooks/useAuth"; // Hook personnalisé pour obtenir les infos de l'utilisateur
import UserAppointmentsList from "../components/UserAppointmentList";
import AppointmentTable from "../components/AppointmentTable";

// Le composant Appointement est la page principale qui gère l'affichage en fonction du rôle de l'utilisateur.
const Appointement = () => {
  // Récupère les informations de l'utilisateur connecté (par exemple, son rôle)
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* La Sidebar est affichée uniquement pour les rôles 'admin' ou 'vet' */}
      {(user?.role === "admin" || user?.role === "vet") && (
        <Sidebar brand="PetCare" />
      )}

      {/* La Navbar et le formulaire de prise de rendez-vous sont affichés pour le rôle 'pet-owner' */}
      {user?.role === "pet-owner" && (
        <>
          <Navbar className="mt-8" />
          <AppointmentForm />
        </>
      )}

      {/* Le composant AppointmentCalendar est affiché pour les rôles 'vet' ou 'admin'.
          Il est responsable de la récupération des données, de l'affichage du calendrier,
          et du rendu conditionnel de la liste (tableau ou cartes) en fonction du 'userRole' qui lui est passé.
          Notez la correction de la condition logique ici.
      */}
      {(user?.role === "vet" || user?.role === "admin") && (
        <AppointmentTable userRole={user?.role} />
      )}
    </div>
  );
};

export default Appointement;
