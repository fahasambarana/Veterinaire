// src/App.jsx
import { Navigate, Route, Routes } from 'react-router-dom';
import AllPetsAdmin from './components/AllPetsAdmin';
import Dashboard from './components/Dashboard';
import Inscription from './components/Inscription';
import Login from './components/Login';
import { useAuth } from './context/AuthContext'; // 👈 use AuthContext instead of local hook
import OwnerPet from './pages/OwnerPet';
import Profile from './pages/Profile';

function App() {
  const { user, loading } = useAuth(); // 👈 comes from context now

  if (loading) return <div className="text-center mt-10">Chargement...</div>;

  return (
    
      <Routes>
        {/* Public Routes */}
        <Route path="/inscription" element={!user ? <Inscription /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />

        {/* Protected Route */}
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/animaux" element={user ? <OwnerPet /> : <Navigate to="/login" />} />
        <Route path="/allPets" element={user ? <AllPetsAdmin /> : <Navigate to="/login" />} />


        {/* Default Redirect */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    
  );
}

export default App;
