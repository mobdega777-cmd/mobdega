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
import { Loader2, Shield, AlertTriangle, KeyRound, Eye, EyeOff } from "lucide-react";

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
  const [resettingPassword, setResettingPassword] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [showTempPassword, setShowTempPassword] = useState(false);
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

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(password);
  };

  const handleResetPassword = async () => {
    if (!commerce || !tempPassword) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Gere uma senha temporária primeiro.',
      });
      return;
    }

    // Validate password
    if (tempPassword.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 8 caracteres.',
      });
      return;
    }

    setResettingPassword(true);

    try {
      // Update user password via admin API (using service role in edge function would be ideal)
      // For now, we'll use the auth.admin.updateUserById which requires service role
      // Since we can't do that from frontend, we'll send a password reset email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(commerce.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        throw resetError;
      }

      // Mark commerce to force password change
      const { error: updateError } = await supabase
        .from('commerces')
        .update({
          force_password_change: true,
          temp_password_set_at: new Date().toISOString(),
        })
        .eq('id', commerce.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: 'Email de redefinição enviado!',
        description: `Um email foi enviado para ${commerce.email} com instruções para criar uma nova senha.`,
      });

      setTempPassword('');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao resetar senha',
        description: error.message || 'Ocorreu um erro inesperado.',
      });
    } finally {
      setResettingPassword(false);
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
            <Alert className="border-amber-500/30 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-600 dark:text-amber-400">Atenção</AlertTitle>
              <AlertDescription className="text-muted-foreground">
                Use esta opção apenas quando o comércio solicitar recuperação de senha e não tiver acesso ao email cadastrado.
              </AlertDescription>
            </Alert>

            <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="w-5 h-5 text-primary" />
                <h4 className="font-medium">Resetar Senha do Comércio</h4>
              </div>

              <p className="text-sm text-muted-foreground">
                Ao clicar em "Enviar Reset", um email será enviado para <strong>{commerce?.email}</strong> com um link para criar uma nova senha.
              </p>

              <div className="flex gap-2">
                <Button 
                  variant="destructive"
                  onClick={handleResetPassword}
                  disabled={resettingPassword}
                >
                  {resettingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 mr-2" />
                      Enviar Reset de Senha
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• O comércio receberá um email com link para criar nova senha</p>
              <p>• O link expira após 24 horas</p>
              <p>• A senha antiga continuará funcionando até que o usuário crie uma nova</p>
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
