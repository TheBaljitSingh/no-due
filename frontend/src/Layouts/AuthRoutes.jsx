// AuthRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AuthRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    // User not logged in, redirect to home page or login
    return <Navigate to="/login" replace />;
  }

  // User is logged in, show the protected page
  return children;
};

export default AuthRoute;
