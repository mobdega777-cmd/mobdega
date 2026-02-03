import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Users, Eye, EyeOff, Save, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmployeeSettingsSectionProps {
  commerceId: string;
}

const menuItemsConfig = [
  { id: "overview", label: "Visão Geral", defaultEnabled: true },
  { id: "cashregister", label: "Caixa/PDV", defaultEnabled: true },
  { id: "paymentconfig", label: "Configurar Pagamentos", defaultEnabled: false },
  { id: "orders", label: "Gestão Pedidos", defaultEnabled: true },
  { id: "delivery", label: "Delivery", defaultEnabled: true },
  { id: "deliveryzones", label: "Áreas de Entrega", defaultEnabled: false },
  { id: "tables", label: "Mesas/Comandas", defaultEnabled: true },
  { id: "photos", label: "Fotos", defaultEnabled: false },
  { id: "products", label: "Produtos", defaultEnabled: false },
  { id: "categories", label: "Categorias", defaultEnabled: false },
  { id: "stockcontrol", label: "Controle Estoque", defaultEnabled: false },
  { id: "financial", label: "Financeiro", defaultEnabled: false },
  { id: "coupons", label: "Cupom para Clientes", defaultEnabled: false },
  { id: "customers", label: "Clientes", defaultEnabled: false },
  { id: "contract", label: "Contrato", defaultEnabled: false },
  { id: "training", label: "Treinamento", defaultEnabled: false },
  { id: "ranking", label: "Ranking", defaultEnabled: false },
  { id: "forum", label: "Fórum", defaultEnabled: false },
  { id: "settings", label: "Configurações", defaultEnabled: false },
];

const EmployeeSettingsSection = ({ commerceId }: EmployeeSettingsSectionProps) => {
  const [enabledItems, setEnabledItems] = useState<string[]>(
    menuItemsConfig.filter(item => item.defaultEnabled).map(item => item.id)
  );
  const [managementPassword, setManagementPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('commerces')
        .select('employee_visible_menu_items, management_password')
        .eq('id', commerceId)
        .single();

      if (error) {
        console.error('Error fetching employee settings:', error);
      } else if (data) {
        if (data.employee_visible_menu_items && Array.isArray(data.employee_visible_menu_items)) {
          setEnabledItems(data.employee_visible_menu_items as string[]);
        }
        // Don't show existing password, just indicate if one exists
      }
      setLoading(false);
    };

    fetchSettings();
  }, [commerceId]);

  const handleToggleItem = (itemId: string) => {
    setEnabledItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSave = async () => {
    // Validate passwords if trying to set/change
    if (managementPassword || confirmPassword) {
      if (managementPassword !== confirmPassword) {
        toast({ 
          variant: "destructive", 
          title: "Senhas não conferem",
          description: "A senha e a confirmação devem ser iguais."
        });
        return;
      }
      if (managementPassword.length < 4) {
        toast({ 
          variant: "destructive", 
          title: "Senha muito curta",
          description: "A senha deve ter pelo menos 4 caracteres."
        });
        return;
      }
    }

    setSaving(true);

    const updateData: any = {
      employee_visible_menu_items: enabledItems,
    };

    // Only update password if a new one was provided
    if (managementPassword) {
      updateData.management_password = managementPassword;
    }

    const { error } = await supabase
      .from('commerces')
      .update(updateData)
      .eq('id', commerceId);

    if (error) {
      toast({ 
        variant: "destructive", 
        title: "Erro ao salvar",
        description: error.message 
      });
    } else {
      toast({ title: "Configurações de funcionário salvas!" });
      setManagementPassword("");
      setConfirmPassword("");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Controle de Funcionários
        </CardTitle>
        <CardDescription>
          Configure quais itens do menu serão visíveis no modo Funcionário e defina a senha de gestão
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Menu Items Grid */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Itens visíveis no modo Funcionário
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {menuItemsConfig.map((item) => (
              <div 
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm">{item.label}</span>
                <Switch
                  checked={enabledItems.includes(item.id)}
                  onCheckedChange={() => handleToggleItem(item.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Password Section */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <Label className="text-sm font-medium">Senha do Modo Gestão</Label>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Defina uma senha que será solicitada ao alternar para o modo Gestão. 
            Deixe em branco para manter a senha atual.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="management-password-new">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="management-password-new"
                  type={showPassword ? "text" : "password"}
                  value={managementPassword}
                  onChange={(e) => setManagementPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Senha</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a senha"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeSettingsSection;
