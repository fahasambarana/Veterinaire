import React from "react";

import AppointmentForm from "../components/AppointmentForm";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import useAuth from "../hooks/useAuth"; // Hook personnalisé pour obtenir les infos de l'utilisateur
import AppointmentTable from "../components/AppointmentTable";
import UserAppointmentScheduler from "../components/UserAppointementAndscheduler"; // Composant pour le calendrier de prise de rendez-vous

const Appointement = () => {
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

          <UserAppointmentScheduler />
        </>
      )}

      
      {(user?.role === "vet" || user?.role === "admin") && (
        <AppointmentTable userRole={user?.role} />
      )}
    </div>
  );
};

export default Appointement;
