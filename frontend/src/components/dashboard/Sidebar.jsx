import { Home, Settings, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="w-64 h-screen bg-gray-800 text-white fixed p-4">
      <h1 className="text-xl font-bold mb-6">Veterinaire</h1>
      <nav>
        <ul className="space-y-4">
          <li>
            <NavLink
              to="/home"
              className={({ isActive }) =>
                isActive ? "text-blue-400" : "text-white"
              }
            >
              
              <span className="flex"><Home size={20} />Home</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                isActive ? "text-blue-400" : "text-white"
              }
            >
              
              <span className="flex"><User size={20} />  Profile</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                isActive ? "text-blue-400" : "text-white"
              }
            >
              
              <span className="flex"><Settings size={20} />  Settings</span>
            </NavLink>
          </li>
        </ul>
      </nav>
     
    </div>
  );
};

export default Sidebar;
