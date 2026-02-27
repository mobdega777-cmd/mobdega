import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, KeyRound, Eye, EyeOff, RefreshCw } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
}

interface Commerce {
  id: string;
  fantasy_name: string;
  owner_name: string;
  email: string;
  phone: string;
  whatsapp: string | null;
  document_type: string;
  document: string;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  address_number: string | null;
  cep: string | null;
  complement: string | null;
  plan_id: string | null;
  coupon_code: string | null;
  payment_due_day: number | null;
  auto_invoice_day: number | null;
  auto_invoice_enabled: boolean | null;
  management_password: string | null;
}

interface CommerceEditModalProps {
  commerce: Commerce | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const CommerceEditModal = ({ commerce, isOpen, onClose, onSave }: CommerceEditModalProps) => {
  const [formData, setFormData] = useState<Partial<Commerce>>({});
  const [plans, setPlans] = useState<Plan[]>([]);
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (commerce) {
      setFormData(commerce);
    }
    fetchPlans();
  }, [commerce]);

  const fetchPlans = async () => {
    const { data } = await supabase
      .from('plans')
      .select('id, name, price')
      .eq('is_active', true)
      .order('price');
    
    setPlans(data || []);
  };

  const handleSave = async () => {
    if (!commerce) return;
    setSaving(true);

    const { error } = await supabase
      .from('commerces')
      .update({
        fantasy_name: formData.fantasy_name,
        owner_name: formData.owner_name,
        email: formData.email,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        document_type: formData.document_type,
        document: formData.document,
        city: formData.city,
        neighborhood: formData.neighborhood,
        address: formData.address,
        address_number: formData.address_number,
        cep: formData.cep,
        complement: formData.complement,
        plan_id: formData.plan_id,
        coupon_code: formData.coupon_code,
        payment_due_day: formData.payment_due_day,
        auto_invoice_day: formData.auto_invoice_day,
        auto_invoice_enabled: formData.auto_invoice_enabled,
      })
      .eq('id', commerce.id);

    setSaving(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message,
      });
    } else {
      toast({ title: 'Comércio atualizado com sucesso!' });
      onSave();
      onClose();
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  const handleSavePassword = async () => {
    if (!commerce || !newPassword) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Digite uma nova senha.' });
      return;
    }
    if (newPassword.length < 4) {
      toast({ variant: 'destructive', title: 'Senha muito curta', description: 'A senha deve ter pelo menos 4 caracteres.' });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase
      .from('commerces')
      .update({ management_password: newPassword })
      .eq('id', commerce.id);
    setSavingPassword(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar senha', description: error.message });
    } else {
      toast({ title: 'Senha de gestão atualizada com sucesso!' });
      setNewPassword('');
      setFormData({ ...formData, management_password: newPassword });
    }
  };

  const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

  if (!commerce) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Comércio</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="endereco">Endereço</TabsTrigger>
            <TabsTrigger value="plano">Plano/Cobrança</TabsTrigger>
            <TabsTrigger value="seguranca" className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Segurança
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Fantasia *</Label>
                <Input
                  value={formData.fantasy_name || ''}
                  onChange={(e) => setFormData({ ...formData, fantasy_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nome do Proprietário *</Label>
                <Input
                  value={formData.owner_name || ''}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone *</Label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input
                  value={formData.whatsapp || ''}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Documento</Label>
                <Select
                  value={formData.document_type || 'cpf'}
                  onValueChange={(value) => setFormData({ ...formData, document_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpf">CPF</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Documento *</Label>
              <Input
                value={formData.document || ''}
                onChange={(e) => setFormData({ ...formData, document: e.target.value })}
              />
            </div>
          </TabsContent>

          <TabsContent value="endereco" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input
                  value={formData.cep || ''}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input
                  value={formData.neighborhood || ''}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número</Label>
                <Input
                  value={formData.address_number || ''}
                  onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Complemento</Label>
                <Input
                  value={formData.complement || ''}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="plano" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select
                value={formData.plan_id || ''}
                onValueChange={(value) => setFormData({ ...formData, plan_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cupom de Desconto Aplicado</Label>
              <Input
                value={formData.coupon_code || ''}
                onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value || null })}
                placeholder="Ex: MOB50"
              />
              <p className="text-xs text-muted-foreground">
                Cupom utilizado no cadastro. Este desconto é aplicado nas faturas.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dia de Vencimento da Fatura</Label>
                <Select
                  value={String(formData.payment_due_day || 10)}
                  onValueChange={(value) => setFormData({ ...formData, payment_due_day: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dayOptions.map(day => (
                      <SelectItem key={day} value={String(day)}>
                        Dia {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Dia para Gerar Fatura Automática</Label>
                <Select
                  value={String(formData.auto_invoice_day || 5)}
                  onValueChange={(value) => setFormData({ ...formData, auto_invoice_day: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dayOptions.map(day => (
                      <SelectItem key={day} value={String(day)}>
                        Dia {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="seguranca" className="space-y-4 mt-4">
            <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="w-5 h-5 text-primary" />
                <h4 className="font-medium">Senha de Gestão Atual</h4>
              </div>

              {formData.management_password ? (
                <div className="flex items-center gap-2">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={formData.management_password}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Nenhuma senha de gestão configurada.</p>
              )}
            </div>

            <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-primary" />
                <h4 className="font-medium">Alterar Senha de Gestão</h4>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generateRandomPassword}
                  title="Gerar senha aleatória"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              <Button
                onClick={handleSavePassword}
                disabled={savingPassword || !newPassword}
              >
                {savingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Nova Senha
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CommerceEditModal;
