import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Store, 
  MapPin, 
  FileText,
  Clock,
  Save,
  CheckCircle,
  AlertCircle,
  Upload,
  X,
  Camera,
  MessageCircle
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
  cover_url: string | null;
  whatsapp: string | null;
  status: string;
}

const CommerceSettings = ({ commerce }: CommerceSettingsProps) => {
  const [commerceData, setCommerceData] = useState<CommerceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
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
    cover_url: "",
    whatsapp: "",
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
        setCommerceData(data as CommerceData);
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
          cover_url: data.cover_url || "",
          whatsapp: data.whatsapp || "",
        });
        setLogoPreview(data.logo_url || null);
        setCoverPreview(data.cover_url || null);
      }
      setLoading(false);
    };

    fetchCommerce();
  }, [commerce.id]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${commerce.id}/logo/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('commerce-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('commerce-assets')
        .getPublicUrl(fileName);

      setFormData({ ...formData, logo_url: publicUrl });
      setLogoPreview(publicUrl);
      toast({ title: "Logo enviado com sucesso!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao enviar logo", description: error.message });
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = () => {
    setFormData({ ...formData, logo_url: "" });
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${commerce.id}/cover/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('commerce-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('commerce-assets')
        .getPublicUrl(fileName);

      setFormData({ ...formData, cover_url: publicUrl });
      setCoverPreview(publicUrl);
      toast({ title: "Foto de capa enviada com sucesso!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao enviar foto de capa", description: error.message });
    } finally {
      setUploadingCover(false);
    }
  };

  const removeCover = () => {
    setFormData({ ...formData, cover_url: "" });
    setCoverPreview(null);
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  };

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
        cover_url: formData.cover_url || null,
        whatsapp: formData.whatsapp || null,
      })
      .eq('id', commerce.id);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    } else {
      toast({ title: "Configurações salvas com sucesso!" });
      // Atualiza o state local para refletir no sidebar
      if (commerceData) {
        setCommerceData({ ...commerceData, logo_url: formData.logo_url });
      }
    }
    setSaving(false);
  };

  const handleWhatsAppSupport = () => {
    window.open('https://wa.me/5511949830010?text=Olá! Preciso de suporte com meu comércio na Mobdega.', '_blank');
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as informações do seu comércio</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleWhatsAppSupport}
          className="gap-2 text-green-600 border-green-600 hover:bg-green-50"
        >
          <MessageCircle className="w-4 h-4" />
          Contato Suporte
        </Button>
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
        {/* Logo Upload */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Logo do Comércio
            </CardTitle>
            <CardDescription>
              Faça upload da logo que aparecerá no painel e no cardápio digital
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              {logoPreview || formData.logo_url ? (
                <div className="relative">
                  <img 
                    src={logoPreview || formData.logo_url} 
                    alt="Logo do comércio" 
                    className="w-24 h-24 object-cover rounded-xl border-2 border-primary/20"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 w-6 h-6"
                    onClick={removeLogo}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-muted/30"
                >
                  {uploadingLogo ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Upload</span>
                    </>
                  )}
                </div>
              )}
              <div>
                <p className="text-sm font-medium mb-1">Imagem de perfil</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Recomendado: 200x200px, formato PNG ou JPG
                </p>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingLogo ? "Enviando..." : "Selecionar Imagem"}
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* Cover Image Upload */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Foto de Capa
            </CardTitle>
            <CardDescription>
              Essa foto será exibida como banner na vitrine do seu comércio para os clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start gap-6">
              {coverPreview || formData.cover_url ? (
                <div className="relative w-full md:w-80">
                  <img 
                    src={coverPreview || formData.cover_url} 
                    alt="Foto de capa" 
                    className="w-full h-40 object-cover rounded-xl border-2 border-primary/20"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 w-6 h-6"
                    onClick={removeCover}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full md:w-80 h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-muted/30"
                >
                  {uploadingCover ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground mb-1" />
                      <span className="text-sm text-muted-foreground">Clique para enviar foto de capa</span>
                    </>
                  )}
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Imagem de capa</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Recomendado: 1280x400px, formato PNG ou JPG. Esta imagem aparecerá como banner na listagem de comércios.
                </p>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingCover ? "Enviando..." : "Selecionar Foto de Capa"}
                </Button>
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="whatsapp">WhatsApp (para contato dos clientes)</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="Ex: 11999998888"
                />
              </div>
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
