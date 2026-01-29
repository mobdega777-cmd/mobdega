import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CommerceStorefront from "@/components/user/CommerceStorefront";
import AuthModal from "@/components/auth/AuthModal";

const Storefront = () => {
  const { commerceId } = useParams<{ commerceId: string }>();
  const navigate = useNavigate();
  const { isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [commerceExists, setCommerceExists] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const checkCommerce = async () => {
      if (!commerceId) {
        setLoading(false);
        return;
      }

      // Use RPC function to check if commerce exists and is approved
      const { data } = await supabase
        .rpc('get_commerce_storefront', { p_commerce_id: commerceId });

      setCommerceExists(data && data.length > 0);
      setLoading(false);
    };

    checkCommerce();
  }, [commerceId]);

  const handleBack = () => {
    navigate('/');
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!commerceId || !commerceExists) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Estabelecimento não encontrado</p>
        <Button onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Início
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CommerceStorefront 
        commerceId={commerceId} 
        onBack={handleBack}
      />

      {/* Auth Modal for unauthenticated users */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default Storefront;
