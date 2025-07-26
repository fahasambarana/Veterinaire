// src/App.jsx
import { Navigate, Route, Routes } from "react-router-dom";
import AllPetsAdmin from "./components/AllPetsAdmin";
import Dashboard from "./components/Dashboard";
import Inscription from "./components/Inscription";
import Login from "./components/Login";
import { useAuth } from "./context/AuthContext"; // 👈 use AuthContext instead of local hook
import OwnerPet from "./pages/OwnerPet";
import Profile from "./pages/Profile";
import Appointement from "./pages/Appointement";
import AppointementForm from "./components/AppointmentForm";
import Consultation from "./pages/Consultation"; // This might be your ConsultationForm or a wrapper
import ConsultationList from "./pages/ConsultationList";
import ChatPage from "./pages/ChatPage";
import ConsultationDetailsPage from "./pages/ConsultationDetailPage";
import ConsultationForm from "./components/ConsultationForm"; // Import the ConsultationForm component

function App() {
  const { user, loading } = useAuth(); // 👈 comes from context now

  if (loading) return <div className="text-center mt-10">Chargement...</div>;

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/inscription"
        element={!user ? <Inscription /> : <Navigate to="/login" />}
      />
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/dashboard" />}
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={user ? <Dashboard /> : <Navigate to="/login" />}
      />
      <Route
        path="/profile"
        element={user ? <Profile /> : <Navigate to="/login" />}
      />
      <Route
        path="/animaux"
        element={user ? <OwnerPet /> : <Navigate to="/login" />}
      />
      <Route
        path="/appointments"
        element={user ? <Appointement /> : <Navigate to="/login" />}
      />
      <Route
        path="/appointments/new"
        element={user ? <AppointementForm /> : <Navigate to="/login" />}
      />
      {/* Existing route for viewing a consultation (by consultationId) */}
      <Route
        path="/consultations/:consultationId" // Renamed from :appointmentId to :consultationId for clarity
        element={user ? <Consultation /> : <Navigate to="/login" />}
      />
      {/* NEW ROUTE for creating a consultation from an appointment */}
      <Route
        path="/consultations/create"
        element={user ? <ConsultationForm /> : <Navigate to="/login" />}
      />
      <Route
        path="/allPets"
        element={user ? <AllPetsAdmin /> : <Navigate to="/login" />}
      />
      <Route
        path="/consultationList/:petId"
        element={user ? <ConsultationList /> : <Navigate to="/login" />}
      />
      <Route
        path="/messages"
        element={user ? <ChatPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/consultation-details/:consultationId"
        element={<ConsultationDetailsPage />}
      />

      {/* Default Redirect */}
      <Route
        path="*"
        element={<Navigate to={user ? "/dashboard" : "/login"} />}
      />
    </Routes>
  );
}

export default App;
