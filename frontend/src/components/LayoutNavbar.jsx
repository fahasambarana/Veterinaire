import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

const LayoutNavbar = ({ children }) => {
  const location = useLocation();
  const hideSidebarRoutes = ["/", "/inscription"];
  const hideLogoutButton = ["/", "/inscription"];
  const showLogoutButton = !hideLogoutButton.includes(location.pathname);
  const showNavbar = !hideSidebarRoutes.includes(location.pathname);
  const navigate = useNavigate();

  

  return (
    <div className="flex ">

      {showNavbar && <Navbar />}
      <div className={showNavbar ? " flex-1 p-9" : "w-full p-8 bg-gray-200 "}>
        {children}
      </div>
    </div>
  );
};

export default LayoutNavbar;