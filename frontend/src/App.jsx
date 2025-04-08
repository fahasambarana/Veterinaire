import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Layout from "./components/dashboard/Layout";
import Inscription from "./components/Inscription";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Parametre from "./pages/Parametre";
import Profile from "./pages/Profile";

function App() {
  return (
    <div>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Login />}></Route>
            <Route path="/inscription" element={<Inscription />}></Route>
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>}></Route>
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>}></Route>
            <Route path="/settings" element={<ProtectedRoute><Parametre /></ProtectedRoute>}></Route>
          </Routes>
        </Layout>
      </BrowserRouter>
    </div>
  );
}

export default App;
