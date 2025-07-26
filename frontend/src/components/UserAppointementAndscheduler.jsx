// UserAppointmentsAndScheduler.jsx
import React, { useState } from 'react';
import useAuth from "../hooks/useAuth"; // Your authentication hook
import AppointmentListUser from './AppointmentListUser'; // Component to list user appointments
import AppointmentCalendarUser from './AppointmentCalendarUser'; // Component for the appointment calendar
 
const UserAppointmentsAndScheduler = () => {
  const { user, loading } = useAuth();
  const [showScheduler, setShowScheduler] = useState(false); // State to control calendar visibility

  if (loading) {
    return <div className="text-center py-8">Chargement des informations utilisateur...</div>;
  }

  // Optional: Restrict access based on role if this page is only for clients
  if (!user || user.role !== 'pet-owner') {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md text-center text-red-600">
        Vous n'êtes pas autorisé à accéder à cette page. Seuls les clients peuvent prendre et voir leurs rendez-vous.
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md mt-8 mx-auto transition-all duration-300 w-[calc(100%-16rem)] pr-8">
      {/* <h1 className="text-3xl font-bold mb-6 text-teal-800">Votre Espace Rendez-vous</h1> */}

      {/* Conditional rendering based on showScheduler state */}
      {showScheduler ? (
        <AppointmentCalendarUser />
      ) : (
        // Pass a prop to UserAppointmentsList to toggle the scheduler
        <AppointmentListUser onAddAppointmentClick={() => setShowScheduler(true)} />
      )}

      {/* If you want to allow hiding the scheduler once it's shown */}
      {showScheduler && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowScheduler(false)}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow-md transition duration-200"
          >
            Retour à la liste des rendez-vous
          </button>
        </div>
      )}
    </div>
  );
};

export default UserAppointmentsAndScheduler;