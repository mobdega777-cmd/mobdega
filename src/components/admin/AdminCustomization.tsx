import { useEffect, useState } from "react";
import { 
  Palette, 
  Save, 
  Image, 
  Type,
  Layout,
  Upload,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SiteCustomization {
  id: string;
  section: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  cta_text: string | null;
  cta_link: string | null;
  metadata: any;
}

const AdminCustomization = () => {
  const [customizations, setCustomizations] = useState<SiteCustomization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomizations();
  }, []);

  const fetchCustomizations = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('site_customizations')
      .select('*')
      .order('section');

    if (error) {
      console.error('Error fetching customizations:', error);
    } else {
      setCustomizations(data || []);
    }
    setIsLoading(false);
  };

  const updateCustomization = (section: string, field: string, value: string) => {
    setCustomizations(prev => 
      prev.map(item => 
        item.section === section 
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);

    for (const customization of customizations) {
      const updateData: any = {
        title: customization.title,
        subtitle: customization.subtitle,
        description: customization.description,
        image_url: customization.image_url,
        cta_text: customization.cta_text,
        cta_link: customization.cta_link,
      };
      
      // Include metadata for footer section
      if (customization.section === 'footer') {
        updateData.metadata = customization.metadata;
      }

      const { error } = await supabase
        .from('site_customizations')
        .update(updateData)
        .eq('id', customization.id);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar',
          description: error.message,
        });
        setIsSaving(false);
        return;
      }
    }

    toast({ title: 'Configurações salvas com sucesso!' });
    setIsSaving(false);
  };

  const getSectionByKey = (key: string) => {
    return customizations.find(c => c.section === key);
  };

  const sectionLabels: Record<string, string> = {
    hero: 'Banner Principal (Hero)',
    benefits: 'Seção de Benefícios',
    featured: 'Lojas em Destaque',
    footer: 'Rodapé',
  };

  // Footer metadata state
  const [footerMetadata, setFooterMetadata] = useState({
    email: '',
    phone: '',
    address: '',
    instagram: '',
    facebook: '',
    twitter: '',
  });

  useEffect(() => {
    const footer = customizations.find(c => c.section === 'footer');
    if (footer?.metadata) {
      setFooterMetadata({
        email: footer.metadata.email || '',
        phone: footer.metadata.phone || '',
        address: footer.metadata.address || '',
        instagram: footer.metadata.instagram || '',
        facebook: footer.metadata.facebook || '',
        twitter: footer.metadata.twitter || '',
      });
    }
  }, [customizations]);

  const updateFooterMetadata = (field: string, value: string) => {
    setFooterMetadata(prev => ({ ...prev, [field]: value }));
    setCustomizations(prev => 
      prev.map(item => 
        item.section === 'footer' 
          ? { ...item, metadata: { ...item.metadata, [field]: value } }
          : item
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Personalização
          </h1>
          <p className="text-muted-foreground mt-1">
            Customize textos e imagens do site
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchCustomizations}>
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
          <Button className="gap-2" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="border-border/50">
          <CardContent className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="hero" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="hero" className="gap-2">
              <Layout className="w-4 h-4" />
              Hero
            </TabsTrigger>
            <TabsTrigger value="benefits" className="gap-2">
              <Type className="w-4 h-4" />
              Benefícios
            </TabsTrigger>
            <TabsTrigger value="featured" className="gap-2">
              <Image className="w-4 h-4" />
              Destaques
            </TabsTrigger>
            <TabsTrigger value="footer" className="gap-2">
              <Layout className="w-4 h-4" />
              Rodapé
            </TabsTrigger>
          </TabsList>

          {['hero', 'benefits', 'featured'].map((sectionKey) => {
            const section = getSectionByKey(sectionKey);
            if (!section) return null;

            return (
              <TabsContent key={sectionKey} value={sectionKey}>
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5 text-primary" />
                      {sectionLabels[sectionKey]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor={`${sectionKey}-title`}>Título</Label>
                        <Input
                          id={`${sectionKey}-title`}
                          value={section.title || ''}
                          onChange={(e) => updateCustomization(sectionKey, 'title', e.target.value)}
                          placeholder="Título da seção"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${sectionKey}-subtitle`}>Subtítulo</Label>
                        <Input
                          id={`${sectionKey}-subtitle`}
                          value={section.subtitle || ''}
                          onChange={(e) => updateCustomization(sectionKey, 'subtitle', e.target.value)}
                          placeholder="Subtítulo da seção"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${sectionKey}-description`}>Descrição</Label>
                      <Textarea
                        id={`${sectionKey}-description`}
                        value={section.description || ''}
                        onChange={(e) => updateCustomization(sectionKey, 'description', e.target.value)}
                        placeholder="Descrição da seção"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${sectionKey}-image`}>URL da Imagem</Label>
                      <div className="flex gap-2">
                        <Input
                          id={`${sectionKey}-image`}
                          value={section.image_url || ''}
                          onChange={(e) => updateCustomization(sectionKey, 'image_url', e.target.value)}
                          placeholder="https://exemplo.com/imagem.jpg"
                        />
                        <Button variant="outline" size="icon">
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>
                      {section.image_url && (
                        <div className="mt-2 p-4 bg-muted/30 rounded-lg">
                          <img 
                            src={section.image_url} 
                            alt="Preview" 
                            className="max-h-40 rounded-lg object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {sectionKey === 'hero' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor={`${sectionKey}-cta-text`}>Texto do Botão</Label>
                          <Input
                            id={`${sectionKey}-cta-text`}
                            value={section.cta_text || ''}
                            onChange={(e) => updateCustomization(sectionKey, 'cta_text', e.target.value)}
                            placeholder="Ex: Explorar Lojas"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${sectionKey}-cta-link`}>Link do Botão</Label>
                          <Input
                            id={`${sectionKey}-cta-link`}
                            value={section.cta_link || ''}
                            onChange={(e) => updateCustomization(sectionKey, 'cta_link', e.target.value)}
                            placeholder="/lojas"
                          />
                        </div>
                      </div>
                    )}

                    {/* Preview */}
                    <div className="pt-6 border-t border-border">
                      <h4 className="text-sm font-medium text-muted-foreground mb-4">
                        Pré-visualização
                      </h4>
                      <div className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl">
                        <h2 className="text-2xl font-display font-bold text-foreground">
                          {section.title || 'Título da Seção'}
                        </h2>
                        {section.subtitle && (
                          <p className="text-lg text-muted-foreground mt-2">
                            {section.subtitle}
                          </p>
                        )}
                        {section.description && (
                          <p className="text-muted-foreground mt-2">
                            {section.description}
                          </p>
                        )}
                        {section.cta_text && (
                          <Button className="mt-4" variant="hero">
                            {section.cta_text}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}

          {/* Footer Tab Content */}
          <TabsContent value="footer">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  {sectionLabels.footer}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="footer-description">Descrição da Marca</Label>
                  <Textarea
                    id="footer-description"
                    value={getSectionByKey('footer')?.description || ''}
                    onChange={(e) => updateCustomization('footer', 'description', e.target.value)}
                    placeholder="Descrição sobre a plataforma"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="footer-email">E-mail de Contato</Label>
                    <Input
                      id="footer-email"
                      type="email"
                      value={footerMetadata.email}
                      onChange={(e) => updateFooterMetadata('email', e.target.value)}
                      placeholder="contato@mobdega.com.br"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="footer-phone">Telefone</Label>
                    <Input
                      id="footer-phone"
                      value={footerMetadata.phone}
                      onChange={(e) => updateFooterMetadata('phone', e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer-address">Endereço</Label>
                  <Textarea
                    id="footer-address"
                    value={footerMetadata.address}
                    onChange={(e) => updateFooterMetadata('address', e.target.value)}
                    placeholder="São Paulo, SP&#10;Brasil"
                    rows={2}
                  />
                </div>

                <div className="border-t border-border pt-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-4">Redes Sociais</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="footer-instagram">Instagram URL</Label>
                      <Input
                        id="footer-instagram"
                        value={footerMetadata.instagram}
                        onChange={(e) => updateFooterMetadata('instagram', e.target.value)}
                        placeholder="https://instagram.com/mobdega"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footer-facebook">Facebook URL</Label>
                      <Input
                        id="footer-facebook"
                        value={footerMetadata.facebook}
                        onChange={(e) => updateFooterMetadata('facebook', e.target.value)}
                        placeholder="https://facebook.com/mobdega"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footer-twitter">Twitter URL</Label>
                      <Input
                        id="footer-twitter"
                        value={footerMetadata.twitter}
                        onChange={(e) => updateFooterMetadata('twitter', e.target.value)}
                        placeholder="https://twitter.com/mobdega"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AdminCustomization;
