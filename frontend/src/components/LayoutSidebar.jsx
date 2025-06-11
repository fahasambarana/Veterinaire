import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

const LayoutSidebar = ({ children }) => {
  const location = useLocation();
  const hideSidebarRoutes = ["/", "/inscription"];
  const showSidebar = !hideSidebarRoutes.includes(location.pathname);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {showSidebar && <Sidebar />}
      <main
        className={`
          flex-grow
          p-8
          transition-all duration-300
          ${showSidebar ? "ml-0 md:ml-64" : "w-full"}
        `}
      >
        {children}
      </main>
    </div>
  );
};

export default LayoutSidebar;
