import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  FileText,
  Clock,
  Save,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CommerceSettingsProps {
  commerce: {
    id: string;
    fantasy_name: string;
    status: string;
  };
}

interface CommerceData {
  id: string;
  fantasy_name: string;
  owner_name: string;
  document: string;
  document_type: string;
  email: string;
  phone: string;
  address: string | null;
  address_number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  cep: string | null;
  logo_url: string | null;
  status: string;
}

const CommerceSettings = ({ commerce }: CommerceSettingsProps) => {
  const [commerceData, setCommerceData] = useState<CommerceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    fantasy_name: "",
    owner_name: "",
    email: "",
    phone: "",
    address: "",
    address_number: "",
    complement: "",
    neighborhood: "",
    city: "",
    cep: "",
    logo_url: "",
  });

  useEffect(() => {
    const fetchCommerce = async () => {
      const { data, error } = await supabase
        .from('commerces')
        .select('*')
        .eq('id', commerce.id)
        .single();

      if (error) {
        console.error('Error fetching commerce:', error);
      } else {
        setCommerceData(data);
        setFormData({
          fantasy_name: data.fantasy_name,
          owner_name: data.owner_name,
          email: data.email,
          phone: data.phone,
          address: data.address || "",
          address_number: data.address_number || "",
          complement: data.complement || "",
          neighborhood: data.neighborhood || "",
          city: data.city || "",
          cep: data.cep || "",
          logo_url: data.logo_url || "",
        });
      }
      setLoading(false);
    };

    fetchCommerce();
  }, [commerce.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from('commerces')
      .update({
        fantasy_name: formData.fantasy_name,
        owner_name: formData.owner_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address || null,
        address_number: formData.address_number || null,
        complement: formData.complement || null,
        neighborhood: formData.neighborhood || null,
        city: formData.city || null,
        cep: formData.cep || null,
        logo_url: formData.logo_url || null,
      })
      .eq('id', commerce.id);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    } else {
      toast({ title: "Configurações salvas com sucesso!" });
    }
    setSaving(false);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string; icon: React.ElementType }> = {
      pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-500", icon: Clock },
      approved: { label: "Aprovado", color: "bg-green-500/20 text-green-500", icon: CheckCircle },
      rejected: { label: "Rejeitado", color: "bg-red-500/20 text-red-500", icon: AlertCircle },
      suspended: { label: "Suspenso", color: "bg-gray-500/20 text-gray-500", icon: AlertCircle },
    };
    return config[status] || config.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(commerceData?.status || 'pending');
  const StatusIcon = statusBadge.icon;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as informações do seu comércio</p>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${statusBadge.color}`}>
                <StatusIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium">Status do Comércio</p>
                <p className="text-sm text-muted-foreground">
                  {commerceData?.status === 'approved' 
                    ? 'Seu comércio está ativo e recebendo pedidos'
                    : 'Aguardando aprovação do administrador'}
                </p>
              </div>
            </div>
            <Badge className={`${statusBadge.color} border-0`}>
              {statusBadge.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Informações Básicas
            </CardTitle>
            <CardDescription>
              Dados principais do seu comércio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fantasy_name">Nome Fantasia</Label>
                <Input
                  id="fantasy_name"
                  value={formData.fantasy_name}
                  onChange={(e) => setFormData({ ...formData, fantasy_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="owner_name">Nome do Proprietário</Label>
                <Input
                  id="owner_name"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="logo_url">URL do Logo</Label>
              <Input
                id="logo_url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Documento</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {commerceData?.document_type === 'cnpj' ? 'CNPJ' : 'CPF'}: {commerceData?.document}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Para alterar o documento, entre em contato com o suporte.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Endereço
            </CardTitle>
            <CardDescription>
              Localização do seu estabelecimento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="address">Logradouro</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="address_number">Número</Label>
                <Input
                  id="address_number"
                  value={formData.address_number}
                  onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CommerceSettings;
