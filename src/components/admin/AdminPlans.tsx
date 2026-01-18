import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Package, 
  Settings, 
  Save,
  LayoutDashboard,
  Calculator,
  ShoppingCart,
  Truck,
  MapPin,
  Utensils,
  FolderOpen,
  DollarSign,
  Crown,
  Zap,
  Briefcase
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  type: string;
  price: number;
  description: string | null;
  features: string[];
  is_active: boolean;
  is_featured: boolean;
  allowed_menu_items: string[];
}

const menuItemsConfig = [
  { id: "overview", label: "Visão Geral", icon: LayoutDashboard, required: true },
  { id: "cashregister", label: "Caixa/PDV", icon: Calculator, required: false },
  { id: "orders", label: "Pedidos", icon: ShoppingCart, required: false },
  { id: "delivery", label: "Delivery", icon: Truck, required: false },
  { id: "deliveryzones", label: "Áreas de Entrega", icon: MapPin, required: false },
  { id: "tables", label: "Mesas/Comandas", icon: Utensils, required: false },
  { id: "products", label: "Produtos", icon: Package, required: false },
  { id: "categories", label: "Categorias", icon: FolderOpen, required: false },
  { id: "financial", label: "Financeiro", icon: DollarSign, required: false },
  { id: "settings", label: "Configurações", icon: Settings, required: true },
];

const planIcons: Record<string, React.ElementType> = {
  basic: Package,
  startup: Zap,
  business: Crown,
};

const AdminPlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      toast.error('Erro ao carregar planos');
      console.error(error);
    } else if (data) {
      const formattedPlans: Plan[] = data.map(plan => ({
        id: plan.id,
        name: plan.name,
        type: plan.type,
        price: Number(plan.price),
        description: plan.description,
        features: Array.isArray(plan.features) ? (plan.features as string[]) : [],
        is_active: plan.is_active ?? true,
        is_featured: plan.is_featured ?? false,
        allowed_menu_items: Array.isArray(plan.allowed_menu_items) 
          ? (plan.allowed_menu_items as string[])
          : ["overview", "settings"]
      }));
      setPlans(formattedPlans);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const toggleMenuItem = (planId: string, menuItemId: string) => {
    setPlans(prev => prev.map(plan => {
      if (plan.id !== planId) return plan;
      
      const item = menuItemsConfig.find(m => m.id === menuItemId);
      if (item?.required) return plan; // Can't toggle required items
      
      const currentItems = [...plan.allowed_menu_items];
      const index = currentItems.indexOf(menuItemId);
      
      if (index > -1) {
        currentItems.splice(index, 1);
      } else {
        currentItems.push(menuItemId);
      }
      
      return { ...plan, allowed_menu_items: currentItems };
    }));
  };

  const savePlan = async (plan: Plan) => {
    setSaving(plan.id);
    
    const { error } = await supabase
      .from('plans')
      .update({
        name: plan.name,
        price: plan.price,
        description: plan.description,
        is_active: plan.is_active,
        is_featured: plan.is_featured,
        allowed_menu_items: plan.allowed_menu_items,
      })
      .eq('id', plan.id);

    if (error) {
      toast.error('Erro ao salvar plano');
      console.error(error);
    } else {
      toast.success('Plano atualizado com sucesso!');
    }
    
    setSaving(null);
  };

  const updatePlanField = (planId: string, field: keyof Plan, value: any) => {
    setPlans(prev => prev.map(plan => 
      plan.id === planId ? { ...plan, [field]: value } : plan
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Gerenciar Planos</h1>
        <p className="text-muted-foreground mt-1">
          Configure os planos e defina quais funcionalidades cada um pode acessar
        </p>
      </div>

      <div className="grid gap-6">
        {plans.map((plan) => {
          const PlanIcon = planIcons[plan.type] || Package;
          
          return (
            <Card key={plan.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${
                      plan.type === 'business' ? 'bg-amber-500/20 text-amber-500' :
                      plan.type === 'startup' ? 'bg-primary/20 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      <PlanIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {plan.name}
                        {plan.is_featured && (
                          <Badge variant="default" className="bg-primary text-primary-foreground">
                            Destaque
                          </Badge>
                        )}
                        {!plan.is_active && (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      R$ {Number(plan.price).toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-sm text-muted-foreground">/mês</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Plan Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Plano</Label>
                    <Input
                      value={plan.name}
                      onChange={(e) => updatePlanField(plan.id, 'name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preço (R$)</Label>
                    <Input
                      type="number"
                      value={plan.price}
                      onChange={(e) => updatePlanField(plan.id, 'price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      value={plan.description || ''}
                      onChange={(e) => updatePlanField(plan.id, 'description', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={plan.is_active}
                      onCheckedChange={(checked) => updatePlanField(plan.id, 'is_active', checked)}
                    />
                    <Label>Plano Ativo</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={plan.is_featured}
                      onCheckedChange={(checked) => updatePlanField(plan.id, 'is_featured', checked)}
                    />
                    <Label>Destaque</Label>
                  </div>
                </div>

                <Separator />

                {/* Menu Items Toggle */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    Funcionalidades do Menu
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ative ou desative as opções do menu que este plano pode acessar
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {menuItemsConfig.map((item) => {
                      const ItemIcon = item.icon;
                      const isEnabled = plan.allowed_menu_items.includes(item.id);
                      const isRequired = item.required;
                      
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            isEnabled 
                              ? 'bg-primary/10 border-primary/30' 
                              : 'bg-muted/30 border-border opacity-50'
                          } ${isRequired ? 'cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}`}
                          onClick={() => !isRequired && toggleMenuItem(plan.id, item.id)}
                        >
                          <Switch
                            checked={isEnabled}
                            disabled={isRequired}
                            onCheckedChange={() => toggleMenuItem(plan.id, item.id)}
                          />
                          <div className="flex items-center gap-2 min-w-0">
                            <ItemIcon className={`w-4 h-4 flex-shrink-0 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className={`text-xs font-medium truncate ${isEnabled ? '' : 'text-muted-foreground'}`}>
                              {item.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={() => savePlan(plan)}
                    disabled={saving === plan.id}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving === plan.id ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPlans;
