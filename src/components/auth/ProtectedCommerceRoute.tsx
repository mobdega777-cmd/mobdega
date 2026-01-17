import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedCommerceRouteProps {
  children: React.ReactNode;
}

const ProtectedCommerceRoute = ({ children }: ProtectedCommerceRouteProps) => {
  const { user, isLoading } = useAuth();
  const [checkingCommerce, setCheckingCommerce] = useState(true);
  const [hasCommerce, setHasCommerce] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (!user) {
        if (!cancelled) {
          setHasCommerce(false);
          setCheckingCommerce(false);
        }
        return;
      }

      // Acesso ao painel do comerciante deve ser baseado em "possui comércio".
      const { data, error } = await supabase
        .from("commerces")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!cancelled) {
        setHasCommerce(!error && !!data);
        setCheckingCommerce(false);
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isLoading || checkingCommerce) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !hasCommerce) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedCommerceRoute;
