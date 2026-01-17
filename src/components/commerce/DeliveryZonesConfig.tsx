import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCep, fetchAddressByCep } from "@/lib/viaCepService";

interface DeliveryZone {
  id: string;
  commerce_id: string;
  name: string;
  cep_start: string;
  cep_end: string;
  delivery_fee: number;
  estimated_time: number;
  is_active: boolean;
  created_at: string;
}

interface Commerce {
  id: string;
  fantasy_name: string;
  cep: string | null;
  city: string | null;
  address: string | null;
  address_number: string | null;
  neighborhood: string | null;
}

interface DeliveryZonesConfigProps {
  commerceId: string;
}

const DeliveryZonesConfig = ({ commerceId }: DeliveryZonesConfigProps) => {
  const { toast } = useToast();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [commerce, setCommerce] = useState<Commerce | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<DeliveryZone | null>(null);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [lookingUpCep, setLookingUpCep] = useState<'start' | 'end' | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    cep_start: "",
    cep_end: "",
    delivery_fee: "",
    estimated_time: "30",
    is_active: true,
  });

  const [cepInfo, setCepInfo] = useState<{
    start: string | null;
    end: string | null;
  }>({ start: null, end: null });

  useEffect(() => {
    fetchData();
  }, [commerceId]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch commerce info
    const { data: commerceData } = await supabase
      .from('commerces')
      .select('id, fantasy_name, cep, city, address, address_number, neighborhood')
      .eq('id', commerceId)
      .single();
    
    if (commerceData) {
      setCommerce(commerceData);
    }

    // Fetch delivery zones
    const { data: zonesData, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('commerce_id', commerceId)
      .order('name');

    if (error) {
      console.error('Error fetching zones:', error);
    } else {
      setZones(zonesData || []);
    }

    setLoading(false);
  };

  const handleCepLookup = async (field: 'start' | 'end') => {
    const cep = field === 'start' ? formData.cep_start : formData.cep_end;
    if (cep.replace(/\D/g, '').length !== 8) return;

    setLookingUpCep(field);
    const address = await fetchAddressByCep(cep);
    setLookingUpCep(null);

    if (address) {
      setCepInfo(prev => ({
        ...prev,
        [field]: `${address.neighborhood}, ${address.city} - ${address.state}`
      }));
    } else {
      setCepInfo(prev => ({ ...prev, [field]: 'CEP não encontrado' }));
    }
  };

  const handleCepChange = (field: 'cep_start' | 'cep_end', value: string) => {
    const formatted = formatCep(value);
    setFormData(prev => ({ ...prev, [field]: formatted }));

    // Clear previous info
    const infoField = field === 'cep_start' ? 'start' : 'end';
    setCepInfo(prev => ({ ...prev, [infoField]: null }));

    // Auto-lookup when 8 digits
    if (formatted.replace(/\D/g, '').length === 8) {
      setTimeout(() => handleCepLookup(infoField), 300);
    }
  };

  const openNewZoneDialog = () => {
    setEditingZone(null);
    setFormData({
      name: "",
      cep_start: "",
      cep_end: "",
      delivery_fee: "",
      estimated_time: "30",
      is_active: true,
    });
    setCepInfo({ start: null, end: null });
    setIsDialogOpen(true);
  };

  const openEditDialog = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      cep_start: formatCep(zone.cep_start),
      cep_end: formatCep(zone.cep_end),
      delivery_fee: zone.delivery_fee.toString(),
      estimated_time: zone.estimated_time.toString(),
      is_active: zone.is_active,
    });
    setCepInfo({ start: null, end: null });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.cep_start || !formData.cep_end || !formData.delivery_fee) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
      });
      return;
    }

    // Validate CEP range
    const start = parseInt(formData.cep_start.replace(/\D/g, ''), 10);
    const end = parseInt(formData.cep_end.replace(/\D/g, ''), 10);

    if (start > end) {
      toast({
        variant: "destructive",
        title: "Faixa inválida",
        description: "O CEP inicial deve ser menor ou igual ao CEP final.",
      });
      return;
    }

    setSaving(true);

    const zoneData = {
      commerce_id: commerceId,
      name: formData.name,
      cep_start: formData.cep_start.replace(/\D/g, ''),
      cep_end: formData.cep_end.replace(/\D/g, ''),
      delivery_fee: parseFloat(formData.delivery_fee),
      estimated_time: parseInt(formData.estimated_time, 10),
      is_active: formData.is_active,
    };

    let error;
    if (editingZone) {
      const { error: updateError } = await supabase
        .from('delivery_zones')
        .update(zoneData)
        .eq('id', editingZone.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('delivery_zones')
        .insert(zoneData);
      error = insertError;
    }

    setSaving(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message,
      });
    } else {
      toast({
        title: editingZone ? "Zona atualizada!" : "Zona criada!",
        description: `A zona "${formData.name}" foi ${editingZone ? 'atualizada' : 'criada'} com sucesso.`,
      });
      setIsDialogOpen(false);
      fetchData();
    }
  };

  const handleDelete = async () => {
    if (!zoneToDelete) return;

    const { error } = await supabase
      .from('delivery_zones')
      .delete()
      .eq('id', zoneToDelete.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error.message,
      });
    } else {
      toast({
        title: "Zona excluída",
        description: `A zona "${zoneToDelete.name}" foi excluída.`,
      });
      fetchData();
    }

    setDeleteDialogOpen(false);
    setZoneToDelete(null);
  };

  const toggleZoneActive = async (zone: DeliveryZone) => {
    const { error } = await supabase
      .from('delivery_zones')
      .update({ is_active: !zone.is_active })
      .eq('id', zone.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: error.message,
      });
    } else {
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Store Address Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            Endereço da Loja
          </CardTitle>
          <CardDescription>
            Este é o endereço base para calcular as entregas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commerce?.cep ? (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">
                  {commerce.address}{commerce.address_number ? `, ${commerce.address_number}` : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  {commerce.neighborhood ? `${commerce.neighborhood} - ` : ''}{commerce.city}
                </p>
                <p className="text-sm text-muted-foreground">
                  CEP: {formatCep(commerce.cep)}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <XCircle className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Endereço não configurado</p>
                <p className="text-sm text-muted-foreground">
                  Configure o endereço da loja nas Configurações para usar o sistema de entregas.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Zones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Zonas de Entrega
              </CardTitle>
              <CardDescription>
                Configure as áreas de entrega com faixas de CEP e taxas
              </CardDescription>
            </div>
            <Button onClick={openNewZoneDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Zona
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {zones.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma zona de entrega configurada</p>
              <p className="text-sm">Crie zonas para definir suas áreas de entrega e taxas</p>
            </div>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence>
                {zones.map((zone) => (
                  <motion.div
                    key={zone.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-4 rounded-xl border transition-all ${
                      zone.is_active 
                        ? 'bg-card border-border' 
                        : 'bg-muted/30 border-muted opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{zone.name}</h4>
                          {zone.is_active ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary">
                              <CheckCircle2 className="w-3 h-3" />
                              Ativa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              <XCircle className="w-3 h-3" />
                              Inativa
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            CEP: {formatCep(zone.cep_start)} - {formatCep(zone.cep_end)}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            R$ {zone.delivery_fee.toFixed(2)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {zone.estimated_time} min
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={zone.is_active}
                          onCheckedChange={() => toggleZoneActive(zone)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(zone)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setZoneToDelete(zone);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Zone Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingZone ? 'Editar Zona de Entrega' : 'Nova Zona de Entrega'}
            </DialogTitle>
            <DialogDescription>
              Configure a faixa de CEPs, taxa de entrega e tempo estimado
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Zona *</Label>
              <Input
                id="name"
                placeholder="Ex: Centro, Zona Sul, Bairro X"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep_start">CEP Inicial *</Label>
                <div className="relative">
                  <Input
                    id="cep_start"
                    placeholder="00000-000"
                    value={formData.cep_start}
                    onChange={(e) => handleCepChange('cep_start', e.target.value)}
                    maxLength={9}
                  />
                  {lookingUpCep === 'start' && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {cepInfo.start && (
                  <p className="text-xs text-muted-foreground">{cepInfo.start}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep_end">CEP Final *</Label>
                <div className="relative">
                  <Input
                    id="cep_end"
                    placeholder="00000-000"
                    value={formData.cep_end}
                    onChange={(e) => handleCepChange('cep_end', e.target.value)}
                    maxLength={9}
                  />
                  {lookingUpCep === 'end' && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {cepInfo.end && (
                  <p className="text-xs text-muted-foreground">{cepInfo.end}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delivery_fee">Taxa de Entrega (R$) *</Label>
                <Input
                  id="delivery_fee"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="5.00"
                  value={formData.delivery_fee}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_fee: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_time">Tempo Estimado (min)</Label>
                <Input
                  id="estimated_time"
                  type="number"
                  min="1"
                  placeholder="30"
                  value={formData.estimated_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="is_active" className="font-medium">Zona Ativa</Label>
                <p className="text-xs text-muted-foreground">
                  Desative para pausar entregas nesta zona
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir zona de entrega?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a zona "{zoneToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DeliveryZonesConfig;