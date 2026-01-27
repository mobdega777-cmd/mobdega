import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  CreditCard, 
  Banknote, 
  QrCode, 
  Plus, 
  Pencil, 
  Trash2, 
  Percent,
  DollarSign,
  Loader2,
  Wallet,
  Upload,
  X,
  Image as ImageIcon
} from "lucide-react";

interface PaymentMethod {
  id: string;
  commerce_id: string;
  name: string;
  type: string;
  fee_percentage: number;
  fee_fixed: number;
  is_active: boolean;
  pix_key: string | null;
  pix_key_type: string | null;
  pix_qr_code_url: string | null;
}

interface CommercePaymentConfigProps {
  commerceId: string;
}

const defaultPaymentTypes = [
  { type: 'credit', name: 'Cartão de Crédito', icon: CreditCard },
  { type: 'debit', name: 'Cartão de Débito', icon: CreditCard },
  { type: 'pix', name: 'PIX', icon: QrCode },
  { type: 'cash', name: 'Dinheiro', icon: Banknote },
];

const CommercePaymentConfig = ({ commerceId }: CommercePaymentConfigProps) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [uploadingQrCode, setUploadingQrCode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'custom',
    fee_percentage: 0,
    fee_fixed: 0,
    is_active: true,
    pix_key: '',
    pix_key_type: 'cpf',
    pix_qr_code_url: ''
  });

  const fetchPaymentMethods = async () => {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('commerce_id', commerceId)
      .order('type', { ascending: true });

    if (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Erro ao carregar formas de pagamento');
    } else {
      setPaymentMethods(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, [commerceId]);

  const initializeDefaultMethods = async () => {
    setSaving(true);
    
    const defaultMethods = defaultPaymentTypes.map(pt => ({
      commerce_id: commerceId,
      name: pt.name,
      type: pt.type,
      fee_percentage: 0,
      fee_fixed: 0,
      is_active: true
    }));

    const { error } = await supabase
      .from('payment_methods')
      .insert(defaultMethods);

    if (error) {
      console.error('Error initializing payment methods:', error);
      toast.error('Erro ao inicializar formas de pagamento');
    } else {
      toast.success('Formas de pagamento inicializadas');
      fetchPaymentMethods();
    }
    setSaving(false);
  };

  const openAddModal = () => {
    setEditingMethod(null);
    setFormData({
      name: '',
      type: 'custom',
      fee_percentage: 0,
      fee_fixed: 0,
      is_active: true,
      pix_key: '',
      pix_key_type: 'cpf',
      pix_qr_code_url: ''
    });
    setShowModal(true);
  };

  const openEditModal = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      type: method.type,
      fee_percentage: method.fee_percentage,
      fee_fixed: method.fee_fixed,
      is_active: method.is_active,
      pix_key: method.pix_key || '',
      pix_key_type: method.pix_key_type || 'cpf',
      pix_qr_code_url: method.pix_qr_code_url || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);

    const payload = {
      commerce_id: commerceId,
      name: formData.name,
      type: formData.type,
      fee_percentage: formData.fee_percentage,
      fee_fixed: formData.fee_fixed,
      is_active: formData.is_active,
      pix_key: formData.type === 'pix' ? formData.pix_key : null,
      pix_key_type: formData.type === 'pix' ? formData.pix_key_type : null,
      pix_qr_code_url: formData.type === 'pix' ? formData.pix_qr_code_url : null
    };

    if (editingMethod) {
      const { error } = await supabase
        .from('payment_methods')
        .update(payload)
        .eq('id', editingMethod.id);

      if (error) {
        console.error('Error updating payment method:', error);
        toast.error('Erro ao atualizar forma de pagamento');
      } else {
        toast.success('Forma de pagamento atualizada');
        setShowModal(false);
        fetchPaymentMethods();
      }
    } else {
      const { error } = await supabase
        .from('payment_methods')
        .insert(payload);

      if (error) {
        console.error('Error creating payment method:', error);
        toast.error('Erro ao criar forma de pagamento');
      } else {
        toast.success('Forma de pagamento criada');
        setShowModal(false);
        fetchPaymentMethods();
      }
    }

    setSaving(false);
  };

  const toggleActive = async (method: PaymentMethod) => {
    const { error } = await supabase
      .from('payment_methods')
      .update({ is_active: !method.is_active })
      .eq('id', method.id);

    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      fetchPaymentMethods();
    }
  };

  const deleteMethod = async (method: PaymentMethod) => {
    if (!confirm(`Deseja excluir "${method.name}"?`)) return;

    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', method.id);

    if (error) {
      toast.error('Erro ao excluir forma de pagamento');
    } else {
      toast.success('Forma de pagamento excluída');
      fetchPaymentMethods();
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'credit':
      case 'debit':
        return CreditCard;
      case 'pix':
        return QrCode;
      case 'cash':
        return Banknote;
      default:
        return Wallet;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Configurar Pagamentos</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Configure as formas de pagamento e taxas do seu estabelecimento
          </p>
        </div>
        <Button onClick={openAddModal} className="gap-2 shrink-0 w-full sm:w-auto text-sm">
          <Plus className="w-4 h-4" />
          <span className="sm:hidden">Nova Forma</span>
          <span className="hidden sm:inline">Nova Forma de Pagamento</span>
        </Button>
      </div>

      {paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma forma de pagamento configurada</h3>
            <p className="text-muted-foreground mb-4">
              Inicialize as formas de pagamento padrão ou adicione manualmente
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={initializeDefaultMethods} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Inicializar Padrões
              </Button>
              <Button variant="outline" onClick={openAddModal}>
                Adicionar Manualmente
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {paymentMethods.map((method) => {
            const Icon = getIconForType(method.type);
            const hasFee = method.fee_percentage > 0 || method.fee_fixed > 0;
            
            return (
              <Card key={method.id} className={!method.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${method.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Icon className={`w-6 h-6 ${method.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{method.name}</h3>
                        {!method.is_active && (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                        {method.type === 'custom' && (
                          <Badge variant="outline">Personalizado</Badge>
                        )}
                      </div>
                      
                      {hasFee && (
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          {method.fee_percentage > 0 && (
                            <span className="flex items-center gap-1">
                              <Percent className="w-3 h-3" />
                              {method.fee_percentage}%
                            </span>
                          )}
                          {method.fee_fixed > 0 && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              R$ {method.fee_fixed.toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {method.type === 'pix' && method.pix_key && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Chave: {method.pix_key}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={method.is_active}
                        onCheckedChange={() => toggleActive(method)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(method)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {method.type === 'custom' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMethod(method)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Cartão de Crédito"
              />
            </div>

            {!editingMethod && (
              <div>
                <Label>Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Cartão de Crédito</SelectItem>
                    <SelectItem value="debit">Cartão de Débito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Taxa Percentual (%)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.fee_percentage}
                  onChange={(e) => setFormData({ ...formData, fee_percentage: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Taxa Fixa (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.fee_fixed}
                  onChange={(e) => setFormData({ ...formData, fee_fixed: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            {formData.type === 'pix' && (
              <>
                <div>
                  <Label>Tipo da Chave PIX</Label>
                  <Select
                    value={formData.pix_key_type}
                    onValueChange={(value) => setFormData({ ...formData, pix_key_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="phone">Telefone</SelectItem>
                      <SelectItem value="random">Chave Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Chave PIX</Label>
                  <Input
                    value={formData.pix_key}
                    onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                    placeholder="Digite sua chave PIX"
                  />
                </div>
                <div>
                  <Label>QR Code PIX (opcional)</Label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      if (file.size > 5 * 1024 * 1024) {
                        toast.error('Imagem deve ter no máximo 5MB');
                        return;
                      }

                      setUploadingQrCode(true);
                      try {
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${commerceId}/pix-qrcode-${Date.now()}.${fileExt}`;

                        const { error: uploadError } = await supabase.storage
                          .from('commerce-assets')
                          .upload(fileName, file, { upsert: true });

                        if (uploadError) throw uploadError;

                        const { data: { publicUrl } } = supabase.storage
                          .from('commerce-assets')
                          .getPublicUrl(fileName);

                        setFormData({ ...formData, pix_qr_code_url: publicUrl });
                        toast.success('QR Code enviado com sucesso');
                      } catch (error) {
                        console.error('Error uploading QR code:', error);
                        toast.error('Erro ao enviar QR Code');
                      } finally {
                        setUploadingQrCode(false);
                      }
                    }}
                  />
                  
                  {formData.pix_qr_code_url ? (
                    <div className="mt-2 relative inline-block">
                      <img 
                        src={formData.pix_qr_code_url} 
                        alt="QR Code PIX" 
                        className="w-32 h-32 object-contain border rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 w-6 h-6"
                        onClick={() => setFormData({ ...formData, pix_qr_code_url: '' })}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-2 gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingQrCode}
                    >
                      {uploadingQrCode ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {uploadingQrCode ? 'Enviando...' : 'Enviar imagem do QR Code'}
                    </Button>
                  )}
                </div>
              </>
            )}

            <div className="flex items-center gap-3">
              <Switch
                id="is-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is-active">Ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingMethod ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommercePaymentConfig;
