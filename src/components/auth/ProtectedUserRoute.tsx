import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedUserRouteProps {
  children: ReactNode;
}

const ProtectedUserRoute = ({ children }: ProtectedUserRouteProps) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/');
      } else {
        setIsChecking(false);
      }
    }
  }, [user, isLoading, navigate]);

  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedUserRoute;
