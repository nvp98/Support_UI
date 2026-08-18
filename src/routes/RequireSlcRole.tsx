import type { JSX } from "react";
import { Navigate } from "react-router-dom";

interface RequireSlcRoleProps {
  children: JSX.Element;
  allowedRoles: string[];
}

const RequireSlcRole = ({ children, allowedRoles }: RequireSlcRoleProps) => {
  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;
  const slcRoles: string[] = user?.slcRoles || [];

  if (!slcRoles.some((role) => allowedRoles.includes(role))) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireSlcRole;
