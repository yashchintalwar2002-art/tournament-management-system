import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, role, allowedRoles }) {
  const token = sessionStorage.getItem("token");
  const userRole = sessionStorage.getItem("role");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const dashboardPath =
    userRole === "ADMIN"
      ? "/admin"
      : userRole === "ORGANIZER"
      ? "/organizer"
      : "/player";

  if (role && userRole !== role) {
    return <Navigate to={dashboardPath} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
}

export default ProtectedRoute;
