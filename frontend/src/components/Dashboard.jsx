import React from "react";
import useAuth from "../hooks/useAuth"; // Custom hook to get user
import AdminDashboard from "./AdminDashboard";
import PetOwnerDashboard from "./PetOwnerDashboard";
import VetDashboard from "./VetDashboard";

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center">Chargement...</div>;
  }

  if (!user) {
    return <div className="text-center">Veuillez vous connecter.</div>;
  }

  // Check the role and render the appropriate dashboard
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {user?.role === "admin" && <AdminDashboard />}
      {user?.role === "vet" && <VetDashboard />}
      {user?.role === "pet-owner" && <PetOwnerDashboard />}
    </div>
  );
};

export default Dashboard;
