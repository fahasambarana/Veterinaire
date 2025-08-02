import { CalendarCheck, Home, LogOut, Menu, MessageSquare, Bell,PawPrint, Settings, User, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../assets/LogoNgeza.png";
import { useAuth } from "../context/AuthContext"; // adjust if needed
import LogoutModal from "./LogoutModal"; // Import the modal component

const menuItems = [
  { label: "Accueil", icon: Home, path: "/dashboard" },
  { label: "Mes animaux", icon: PawPrint, path: "/animaux" },  // Adjust path to correct one if needed
  { label: "Rendez-vous", icon: CalendarCheck, path: "/appointments" },
  { label: "Messages", icon: MessageSquare, path: "/messages" },
  { label: "Profil", icon: User, path: "/profile" },
  { label: "Notifications", icon: Bell, path: "/notifications" },
  { label: "Paramètres", icon: Settings, path: "/settings" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false); // Modal state
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-teal-700 text-white shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-start items-center h-16">
            {/* Brand */}
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold"><img src={Logo} className="w-[50px]" /></span>
            </div>

            {/* Desktop menu */}
            <div className="hidden md:flex items-center space-x-6 ml-4">
              {menuItems.map(({ label, icon: Icon, path }) => (
                <Link
                  key={label}
                  to={path}
                  className={`relative flex items-center px-3 py-2 text-sm font-medium group overflow-hidden ${
                    location.pathname === path && path !== "/dashboard"
                      ? "after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-white"
                      : ""
                  }`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span className="ml-2">{label}</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </div>

            {/* Logout Button (Desktop) */}
            <div className="ml-auto">
              <button
                onClick={() => setIsLogoutModalOpen(true)} // Open modal
                className="flex items-center px-3 py-2 text-sm font-medium hover:bg-gray-600 rounded transition-colors"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu toggle */}
      <div className="md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md inline-flex items-center justify-center text-white hover:bg-green-700 focus:outline-none"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="absolute top-16 left-0 right-0 bg-green-600 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2 pt-2 pb-4 space-y-1">
              {menuItems.map(({ label, icon: Icon, path }) => (
                <Link
                  key={label}
                  to={path}
                  className={`flex items-center px-4 py-3 text-base font-medium ${
                    location.pathname === path && path !== "/dashboard"
                      ? "bg-green-700"
                      : "hover:bg-green-700"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  <span>{label}</span>
                </Link>
              ))}

              {/* Logout Button (Mobile) */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsLogoutModalOpen(true); // Open modal
                }}
                className="flex items-center w-full px-4 py-3 text-base font-medium hover:bg-red-400 text-white"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spacer below navbar */}
      <div className="pt-16"></div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onCancel={() => setIsLogoutModalOpen(false)} // Close modal
        onConfirm={() => {
          handleLogout();
          setIsLogoutModalOpen(false); // Close modal after logout
        }}
      />
    </>
  );
}
