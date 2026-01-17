import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedCommerceRouteProps {
  children: React.ReactNode;
}

const ProtectedCommerceRoute = ({ children }: ProtectedCommerceRouteProps) => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Allow commerce owners and master admins
  if (!user || (role !== 'commerce' && role !== 'master_admin')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedCommerceRoute;
