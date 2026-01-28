import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUp, 
  Check, 
  Crown, 
  Rocket, 
  Star,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatCurrency";
import { getFeatureLabels } from "@/lib/planFeatures";

interface Plan {
  id: string;
  name: string;
  type: string;
  price: number;
  description: string | null;
  features: string[];
  allowed_menu_items: string[];
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  commerceId: string;
  currentPlanId: string | null;
}

const UpgradeModal = ({ isOpen, onClose, commerceId, currentPlanId }: UpgradeModalProps) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen, currentPlanId]);

  const fetchPlans = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (data) {
      const formattedPlans = data.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        price: Number(p.price),
        description: p.description,
        features: Array.isArray(p.features) ? (p.features as string[]) : [],
        allowed_menu_items: Array.isArray(p.allowed_menu_items) ? (p.allowed_menu_items as string[]) : []
      }));
      
      setPlans(formattedPlans);
      
      const current = formattedPlans.find(p => p.id === currentPlanId);
      setCurrentPlan(current || null);
    }
    setLoading(false);
  };

  const handleRequestUpgrade = async () => {
    if (!selectedPlanId) {
      toast({
        variant: "destructive",
        title: "Selecione um plano"
      });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from('commerces')
      .update({
        requested_plan_id: selectedPlanId,
        upgrade_request_date: new Date().toISOString(),
        upgrade_request_status: 'pending'
      })
      .eq('id', commerceId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao solicitar upgrade",
        description: error.message
      });
    } else {
      // Create notification for master admin
      const selectedPlan = plans.find(p => p.id === selectedPlanId);
      const { data: commerceData } = await supabase
        .from('commerces')
        .select('fantasy_name')
        .eq('id', commerceId)
        .single();

      await supabase
        .from('admin_notifications')
        .insert({
          type: 'upgrade_request',
          title: 'Solicitação de Upgrade',
          message: `O comércio ${commerceData?.fantasy_name || 'desconhecido'} solicitou upgrade para o plano ${selectedPlan?.name || 'desconhecido'}.`,
          commerce_id: commerceId
        });

      toast({
        title: "Solicitação enviada!",
        description: "Seu pedido de upgrade foi enviado para análise. Em breve você receberá uma resposta."
      });
      onClose();
    }

    setSubmitting(false);
  };

  const getPlanIcon = (type: string) => {
    switch (type) {
      case 'basic':
        return Star;
      case 'startup':
        return Rocket;
      case 'business':
        return Crown;
      default:
        return Star;
    }
  };

  const availablePlans = plans.filter(p => {
    if (!currentPlan) return true;
    return p.price > currentPlan.price;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUp className="w-5 h-5 text-primary" />
            Fazer Upgrade do Plano
          </DialogTitle>
          <DialogDescription>
            Escolha um plano superior para desbloquear mais funcionalidades
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : availablePlans.length === 0 ? (
          <div className="text-center py-8">
            <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Você já está no melhor plano!</h3>
            <p className="text-muted-foreground">
              Não há planos superiores disponíveis para upgrade.
            </p>
          </div>
        ) : (
          <>
            {currentPlan && (
              <div className="mb-4 p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground">Seu plano atual:</p>
                <p className="font-semibold">{currentPlan.name} - {formatCurrency(currentPlan.price)}/mês</p>
              </div>
            )}

            <div className="grid gap-4">
              {availablePlans.map((plan) => {
                const Icon = getPlanIcon(plan.type);
                const isSelected = selectedPlanId === plan.id;

                return (
                  <Card 
                    key={plan.id} 
                    className={`cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            plan.type === 'business' 
                              ? 'bg-yellow-500/20 text-yellow-500' 
                              : plan.type === 'startup'
                                ? 'bg-purple-500/20 text-purple-500'
                                : 'bg-primary/20 text-primary'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold flex items-center gap-2">
                              {plan.name}
                              {plan.type === 'business' && (
                                <Badge variant="default" className="text-xs">Mais Popular</Badge>
                              )}
                            </h4>
                            <p className="text-sm text-muted-foreground">{plan.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">
                            {formatCurrency(plan.price)}
                          </p>
                          <p className="text-xs text-muted-foreground">/mês</p>
                        </div>
                      </div>

                      {getFeatureLabels(plan.allowed_menu_items).length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {getFeatureLabels(plan.allowed_menu_items).slice(0, 6).map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="text-muted-foreground">{feature}</span>
                            </div>
                          ))}
                          {getFeatureLabels(plan.allowed_menu_items).length > 6 && (
                            <div className="text-xs text-muted-foreground col-span-2">
                              +{getFeatureLabels(plan.allowed_menu_items).length - 6} mais funcionalidades
                            </div>
                          )}
                        </div>
                      )}

                      {isSelected && (
                        <div className="mt-4 pt-4 border-t flex items-center gap-2 text-primary">
                          <Check className="w-5 h-5" />
                          <span className="font-medium">Plano selecionado</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={handleRequestUpgrade} 
                disabled={!selectedPlanId || submitting}
                className="flex-1 gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4" />
                )}
                Solicitar Upgrade
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Sua solicitação será analisada pelo administrador e você receberá uma confirmação em breve.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
