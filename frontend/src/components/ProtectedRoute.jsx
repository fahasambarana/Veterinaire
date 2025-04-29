import { useState } from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Change to false to test redirect
  return isAuthenticated ? children : <Navigate to="/home" />;
};

export default ProtectedRoute;