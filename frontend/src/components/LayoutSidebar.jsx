import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

const LayoutSidebar = ({ children }) => {
  const location = useLocation();
  const hideSidebarRoutes = ["/", "/inscription"];
  const hideLogoutButton = ["/", "/inscription"];
  const showLogoutButton = !hideLogoutButton.includes(location.pathname);
  const showSidebar = !hideSidebarRoutes.includes(location.pathname);
  const navigate = useNavigate();

  

  return (
    <div className="flex">

      {showSidebar && <Sidebar />}
      <div className={showSidebar ? "ml-11 flex-1 p-8" : "w-full p-8 bg-gray-100"}>
        {children}
      </div>
    </div>
  );
};

export default LayoutSidebar;
