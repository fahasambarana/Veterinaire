import { LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  const location = useLocation();
  const hideSidebarRoutes = ["/", "/inscription"];
  const hideLogoutButton = ["/", "/inscription"];
  const showLogoutButton = !hideLogoutButton.includes(location.pathname);
  const showSidebar = !hideSidebarRoutes.includes(location.pathname);
  const navigate = useNavigate();

  const HandleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="flex">
      {showLogoutButton && (
        <div className="absolute top-4 right-4">
          {/* Position the logout button globally at the top-right */}
          <button
            className="flex items-center text-red-500 space-x-2"
            onClick={HandleLogout}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      )}
      {showSidebar && <Sidebar />}
      <div className={showSidebar ? "ml-64 flex-1 p-8" : "w-full p-8"}>
        {children}
      </div>
    </div>
  );
};

export default Layout;
