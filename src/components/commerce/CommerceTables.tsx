import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Utensils, Users, DollarSign, CreditCard, QrCode, Loader2, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateTableQRCodePDF, generateAllTablesQRCodePDF } from "@/lib/tableQRCodeGenerator";

interface CommerceTablesProps {
  commerceId: string;
}

interface Table {
  id: string;
  number: number;
  name: string | null;
  capacity: number | null;
  status: string;
  opened_at: string | null;
  current_order_id: string | null;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  available: { label: "Disponível", color: "text-green-500", bgColor: "bg-green-500/20" },
  occupied: { label: "Ocupada", color: "text-orange-500", bgColor: "bg-orange-500/20" },
  reserved: { label: "Reservada", color: "text-blue-500", bgColor: "bg-blue-500/20" },
  closed: { label: "Fechada", color: "text-gray-500", bgColor: "bg-gray-500/20" },
};

const CommerceTables = ({ commerceId }: CommerceTablesProps) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tablePaymentRequired, setTablePaymentRequired] = useState(true);
  const [generatingQR, setGeneratingQR] = useState<string | null>(null);
  const [generatingAllQR, setGeneratingAllQR] = useState(false);
  const [commerceName, setCommerceName] = useState<string>('');
  const [commerceLogoUrl, setCommerceLogoUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    number: "",
    name: "",
    capacity: "4",
  });

  const fetchTables = async () => {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('commerce_id', commerceId)
      .order('number');

    if (error) {
      console.error('Error fetching tables:', error);
    } else {
      setTables(data || []);
    }
    setLoading(false);
  };

  const fetchPaymentSetting = async () => {
    const { data, error } = await supabase
      .from('commerces')
      .select('table_payment_required, fantasy_name, logo_url')
      .eq('id', commerceId)
      .single();

    if (!error && data) {
      setTablePaymentRequired(data.table_payment_required ?? true);
      setCommerceName(data.fantasy_name || 'Comércio');
      setCommerceLogoUrl(data.logo_url);
    }
  };

  const togglePaymentSetting = async (value: boolean) => {
    const { error } = await supabase
      .from('commerces')
      .update({ table_payment_required: value })
      .eq('id', commerceId);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar configuração", description: error.message });
    } else {
      setTablePaymentRequired(value);
      toast({ title: value ? "Pagamento na mesa ativado" : "Pagamento na mesa desativado" });
    }
  };

  useEffect(() => {
    fetchTables();
    fetchPaymentSetting();
  }, [commerceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const tableData = {
      commerce_id: commerceId,
      number: parseInt(formData.number),
      name: formData.name || null,
      capacity: parseInt(formData.capacity) || 4,
    };

    if (editingTable) {
      const { error } = await supabase
        .from('tables')
        .update(tableData)
        .eq('id', editingTable.id);

      if (error) {
        toast({ variant: "destructive", title: "Erro ao atualizar mesa", description: error.message });
      } else {
        toast({ title: "Mesa atualizada com sucesso!" });
        setIsDialogOpen(false);
        fetchTables();
      }
    } else {
      const { error } = await supabase
        .from('tables')
        .insert(tableData);

      if (error) {
        toast({ variant: "destructive", title: "Erro ao criar mesa", description: error.message });
      } else {
        toast({ title: "Mesa criada com sucesso!" });
        setIsDialogOpen(false);
        fetchTables();
      }
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mesa?')) return;

    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao excluir mesa", description: error.message });
    } else {
      toast({ title: "Mesa excluída com sucesso!" });
      fetchTables();
    }
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    setFormData({
      number: table.number.toString(),
      name: table.name || "",
      capacity: table.capacity?.toString() || "4",
    });
    setIsDialogOpen(true);
  };

  const updateTableStatus = async (tableId: string, newStatus: string) => {
    const updateData: Record<string, unknown> = { status: newStatus };
    
    if (newStatus === 'occupied') {
      updateData.opened_at = new Date().toISOString();
    } else if (newStatus === 'available') {
      updateData.opened_at = null;
      updateData.closed_at = new Date().toISOString();
      updateData.current_order_id = null;
    }

    const { error } = await supabase
      .from('tables')
      .update(updateData)
      .eq('id', tableId);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar status", description: error.message });
    } else {
      toast({ title: "Status atualizado!" });
      fetchTables();
    }
  };

  const resetForm = () => {
    setEditingTable(null);
    setFormData({
      number: "",
      name: "",
      capacity: "4",
    });
  };

  const getTimeOpened = (openedAt: string | null) => {
    if (!openedAt) return null;
    const opened = new Date(openedAt);
    const now = new Date();
    const diff = Math.floor((now.getTime() - opened.getTime()) / 1000 / 60);
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  };

  const handleGenerateQRCode = async (table: Table) => {
    setGeneratingQR(table.id);
    try {
      await generateTableQRCodePDF({
        tableNumber: table.number,
        tableName: table.name,
        tableCapacity: table.capacity,
        commerceName,
        commerceLogoUrl,
        commerceId,
      });
      toast({ title: "PDF gerado com sucesso!", description: `QR Code da mesa ${table.number} está pronto para impressão.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao gerar PDF" });
    }
    setGeneratingQR(null);
  };

  const handleGenerateAllQRCodes = async () => {
    if (tables.length === 0) {
      toast({ variant: "destructive", title: "Nenhuma mesa cadastrada" });
      return;
    }
    setGeneratingAllQR(true);
    try {
      const allTablesData = tables.map(table => ({
        tableNumber: table.number,
        tableName: table.name,
        tableCapacity: table.capacity,
        commerceName,
        commerceLogoUrl,
        commerceId,
      }));
      await generateAllTablesQRCodePDF(allTablesData);
      toast({ title: "PDF gerado com sucesso!", description: `${tables.length} etiquetas prontas para impressão.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao gerar PDF" });
    }
    setGeneratingAllQR(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mesas/Comandas</h1>
          <p className="text-muted-foreground">Gerencie as mesas do seu estabelecimento</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Toggle de pagamento na mesa */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Pagamento na mesa</span>
              <span className="text-xs text-muted-foreground">
                {tablePaymentRequired ? "Cliente escolhe forma de pagamento" : "Pagamento no caixa"}
              </span>
            </div>
            <Switch
              checked={tablePaymentRequired}
              onCheckedChange={togglePaymentSetting}
            />
          </div>
          
          {/* Botão para imprimir todas as etiquetas */}
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleGenerateAllQRCodes}
            disabled={generatingAllQR || tables.length === 0}
          >
            {generatingAllQR ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            Imprimir Todas
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Mesa
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTable ? "Editar Mesa" : "Nova Mesa"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="number">Número da Mesa *</Label>
                <Input
                  id="number"
                  type="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Nome/Identificação</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Área externa, VIP..."
                />
              </div>
              <div>
                <Label htmlFor="capacity">Capacidade (pessoas)</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTable ? "Salvar" : "Criar Mesa"}
                </Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = tables.filter(t => t.status === status).length;
          return (
            <Card key={status} className="border-border/50">
              <CardContent className="p-4">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.color}`}>
                  <span className="text-sm font-medium">{config.label}</span>
                  <Badge variant="secondary" className="bg-background/50">
                    {count}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Utensils className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma mesa cadastrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cadastre mesas para gerenciar comandas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map((table) => {
            const status = statusConfig[table.status] || statusConfig.available;
            const timeOpened = getTimeOpened(table.opened_at);

            return (
              <Card 
                key={table.id} 
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  table.status === 'occupied' ? 'border-orange-500/50' : 'border-border/50'
                }`}
              >
                <div className={`absolute top-0 left-0 right-0 h-1 ${status.bgColor.replace('/20', '')}`} />
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-2xl font-bold">
                        {table.number}
                      </h3>
                      {table.name && (
                        <p className="text-xs text-muted-foreground">{table.name}</p>
                      )}
                    </div>
                    <Badge className={`${status.bgColor} ${status.color} border-0`}>
                      {status.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{table.capacity}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 items-center">
                    {table.status === 'available' && (
                      <Button
                        size="sm"
                        className="text-xs px-2 h-7"
                        onClick={() => updateTableStatus(table.id, 'occupied')}
                      >
                        Abrir
                      </Button>
                    )}
                    {table.status === 'occupied' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs px-2 h-7"
                          onClick={() => updateTableStatus(table.id, 'available')}
                        >
                          Fechar
                        </Button>
                        <Button size="sm" className="h-7 w-7 p-0">
                          <DollarSign className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                    {table.status === 'reserved' && (
                      <Button
                        size="sm"
                        className="text-xs px-2 h-7"
                        onClick={() => updateTableStatus(table.id, 'occupied')}
                      >
                        Check-in
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => handleGenerateQRCode(table)}
                      disabled={generatingQR === table.id}
                      title="Gerar QR Code para impressão"
                    >
                      {generatingQR === table.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <QrCode className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => handleEdit(table)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(table.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommerceTables;
