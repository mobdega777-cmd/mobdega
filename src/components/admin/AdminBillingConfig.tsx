import { useEffect, useState } from "react";
import { 
  CreditCard, 
  Upload, 
  Save,
  QrCode,
  Building2,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BillingConfig {
  id?: string;
  pix_key: string;
  pix_key_type: string;
  qr_code_url: string | null;
  bank_name: string | null;
  account_holder: string;
  cnpj: string | null;
}

const AdminBillingConfig = () => {
  const [config, setConfig] = useState<BillingConfig>({
    pix_key: '',
    pix_key_type: 'cnpj',
    qr_code_url: null,
    bank_name: '',
    account_holder: '',
    cnpj: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('billing_config')
      .select('*')
      .limit(1)
      .single();

    if (data) {
      setConfig(data);
    }
    setIsLoading(false);
  };

  const handleUploadQrCode = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `qrcode-pix.${fileExt}`;
    const filePath = `billing/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('commerce-assets')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        variant: 'destructive',
        title: 'Erro no upload',
        description: uploadError.message,
      });
      setUploading(false);
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from('commerce-assets')
      .getPublicUrl(filePath);

    setConfig({ ...config, qr_code_url: publicUrl.publicUrl });
    setUploading(false);
    toast({ title: 'QR Code enviado!' });
  };

  const handleSave = async () => {
    if (!config.pix_key || !config.account_holder) {
      toast({
        variant: 'destructive',
        title: 'Preencha os campos obrigatórios',
        description: 'Chave PIX e Nome do Favorecido são obrigatórios.',
      });
      return;
    }

    setIsSaving(true);

    if (config.id) {
      // Update
      const { error } = await supabase
        .from('billing_config')
        .update({
          pix_key: config.pix_key,
          pix_key_type: config.pix_key_type,
          qr_code_url: config.qr_code_url,
          bank_name: config.bank_name,
          account_holder: config.account_holder,
          cnpj: config.cnpj,
        })
        .eq('id', config.id);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar',
          description: error.message,
        });
      } else {
        toast({ title: 'Configurações salvas!' });
      }
    } else {
      // Insert
      const { data, error } = await supabase
        .from('billing_config')
        .insert({
          pix_key: config.pix_key,
          pix_key_type: config.pix_key_type,
          qr_code_url: config.qr_code_url,
          bank_name: config.bank_name,
          account_holder: config.account_holder,
          cnpj: config.cnpj,
        })
        .select()
        .single();

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar',
          description: error.message,
        });
      } else {
        setConfig(data);
        toast({ title: 'Configurações salvas!' });
      }
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Configurar Cobrança
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure os dados bancários que aparecerão nas faturas dos comerciantes
        </p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Dados de Pagamento PIX
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PIX Key */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo da Chave PIX *</Label>
              <Select
                value={config.pix_key_type}
                onValueChange={(v) => setConfig({ ...config, pix_key_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="random">Chave Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chave PIX *</Label>
              <Input
                value={config.pix_key}
                onChange={(e) => setConfig({ ...config, pix_key: e.target.value })}
                placeholder="Digite a chave PIX"
              />
            </div>
          </div>

          {/* Account Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Favorecido *</Label>
              <Input
                value={config.account_holder}
                onChange={(e) => setConfig({ ...config, account_holder: e.target.value })}
                placeholder="Nome completo ou razão social"
              />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input
                value={config.cnpj || ''}
                onChange={(e) => setConfig({ ...config, cnpj: e.target.value })}
                placeholder="00.000.000/0001-00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nome do Banco</Label>
            <Input
              value={config.bank_name || ''}
              onChange={(e) => setConfig({ ...config, bank_name: e.target.value })}
              placeholder="Ex: Banco do Brasil, Nubank, etc."
            />
          </div>

          {/* QR Code Upload */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              QR Code PIX
            </Label>
            <div className="flex items-start gap-4">
              {config.qr_code_url ? (
                <div className="p-4 bg-white rounded-xl border">
                  <img 
                    src={config.qr_code_url} 
                    alt="QR Code PIX" 
                    className="w-40 h-40 object-contain"
                  />
                </div>
              ) : (
                <div className="w-40 h-40 border-2 border-dashed rounded-xl flex items-center justify-center text-muted-foreground">
                  <QrCode className="w-12 h-12" />
                </div>
              )}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Faça upload da imagem do QR Code que será exibida nas faturas.
                </p>
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadQrCode}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Button variant="outline" className="gap-2" asChild disabled={uploading}>
                    <span>
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Enviando...' : 'Enviar QR Code'}
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </div>

          {/* Preview */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Prévia nas Faturas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 rounded-lg bg-background border">
                <p className="text-xs text-muted-foreground mb-1">
                  Chave PIX ({config.pix_key_type?.toUpperCase() || 'CNPJ'})
                </p>
                <code className="text-sm font-mono">{config.pix_key || '—'}</code>
              </div>
              <div className="text-sm">
                <p><strong>Favorecido:</strong> {config.account_holder || '—'}</p>
                {config.cnpj && <p><strong>CNPJ:</strong> {config.cnpj}</p>}
                {config.bank_name && <p><strong>Banco:</strong> {config.bank_name}</p>}
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBillingConfig;
