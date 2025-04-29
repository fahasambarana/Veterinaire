import { CalendarCheck, Home, LogOut, Menu, MessageSquare, Settings, User, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LogoutModal from "../components/LogoutModal";
import { useAuth } from "../context/AuthContext";

// Sidebar menu config
const menuItems = [
  
  { label: "Accueil", icon: Home, path: "/dashboard" },
  { label: "Rendez-vous", icon: CalendarCheck, path: "/appointments" },
  { label: "Messages", icon: MessageSquare, path: "/messages" },
  { label: "Profil", icon: User, path: "/profile" },
  { label: "Paramètres", icon: Settings, path: "/settings" },
];

export default function Sidebar({ brand = "PetCare" }) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false); // Modal state
  const [isOpen, setIsOpen] = useState(false); // Sidebar state
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Handle logout logic
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile menu toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 p-3 text-gray-800 md:hidden z-50"
      >
        {isOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-teal-600 text-white p-5
        flex flex-col justify-between transition-transform duration-300 ease-in-out z-40
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0`}
      >
        {/* Top: Brand + nav */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-center tracking-wide">
            {brand}
          </h2>
          <nav>
            <ul className="space-y-2">
              {menuItems.map(({ label, icon: Icon, path }) => {
                const isActive = location.pathname === path;
                return (
                  <li key={label}>
                    <Link
                      to={path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                        isActive ? "bg-teal-700" : "hover:bg-teal-800"
                      }`}
                    >
                      <Icon className="mr-3" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Bottom: Logout button */}
        <button
          onClick={() => setIsLogoutModalOpen(true)} // Open logout modal instead of logging out directly
          className="flex items-center w-full p-3 rounded-lg hover:bg-gray-700 transition-colors duration-300"
        >
          <LogOut className="mr-3" />
          Déconnexion
        </button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 md:hidden z-30 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Logout Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onCancel={() => setIsLogoutModalOpen(false)} // Close modal
        onConfirm={() => {
          handleLogout(); // Proceed with logout
          setIsLogoutModalOpen(false); // Close modal after logout
        }}
      />
    </>
  );
}
