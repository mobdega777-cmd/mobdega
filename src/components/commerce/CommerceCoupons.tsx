import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Ticket, Plus, Pencil, Trash2, Copy, Check, Users, Percent, DollarSign, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatCurrency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CommerceCouponsProps {
  commerceId: string;
}

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_value: number | null;
  max_discount: number | null;
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  first_order_only: boolean;
  commerce_id: string;
  created_at: string;
}

const CommerceCoupons = ({ commerceId }: CommerceCouponsProps) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_value: "",
    max_discount: "",
    max_uses: "",
    valid_until: "",
    is_active: true,
    first_order_only: false,
  });

  const fetchCoupons = async () => {
    const { data, error } = await supabase
      .from('commerce_coupons')
      .select('*')
      .eq('commerce_id', commerceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coupons:', error);
      // Se a tabela não existir, apenas mostra vazio
      if (error.code === '42P01') {
        setCoupons([]);
      }
    } else {
      setCoupons(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, [commerceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const couponData = {
      commerce_id: commerceId,
      code: formData.code.toUpperCase().trim(),
      description: formData.description || null,
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value) || 0,
      min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : null,
      max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      valid_until: formData.valid_until || null,
      is_active: formData.is_active,
      first_order_only: formData.first_order_only,
    };

    if (editingCoupon) {
      const { error } = await supabase
        .from('commerce_coupons')
        .update(couponData)
        .eq('id', editingCoupon.id);

      if (error) {
        toast({ variant: "destructive", title: "Erro ao atualizar cupom", description: error.message });
      } else {
        toast({ title: "Cupom atualizado com sucesso!" });
        setIsDialogOpen(false);
        fetchCoupons();
      }
    } else {
      const { error } = await supabase
        .from('commerce_coupons')
        .insert(couponData);

      if (error) {
        if (error.code === '23505') {
          toast({ variant: "destructive", title: "Este código já existe" });
        } else {
          toast({ variant: "destructive", title: "Erro ao criar cupom", description: error.message });
        }
      } else {
        toast({ title: "Cupom criado com sucesso!" });
        setIsDialogOpen(false);
        fetchCoupons();
      }
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cupom?')) return;

    const { error } = await supabase
      .from('commerce_coupons')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao excluir cupom", description: error.message });
    } else {
      toast({ title: "Cupom excluído!" });
      fetchCoupons();
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_order_value: coupon.min_order_value?.toString() || "",
      max_discount: coupon.max_discount?.toString() || "",
      max_uses: coupon.max_uses?.toString() || "",
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : "",
      is_active: coupon.is_active,
      first_order_only: coupon.first_order_only,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      min_order_value: "",
      max_discount: "",
      max_uses: "",
      valid_until: "",
      is_active: true,
      first_order_only: false,
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({ title: "Código copiado!" });
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'DESC';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
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
          <h1 className="text-3xl font-bold">Cupons para Clientes</h1>
          <p className="text-muted-foreground">Crie cupons de desconto para seus clientes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? "Editar Cupom" : "Novo Cupom de Desconto"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Código do Cupom</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="EX: DESC20"
                    required
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={generateRandomCode}>
                    Gerar
                  </Button>
                </div>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Desconto especial para clientes fiéis"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Desconto</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">
                        <span className="flex items-center gap-2">
                          <Percent className="w-4 h-4" /> Porcentagem
                        </span>
                      </SelectItem>
                      <SelectItem value="fixed">
                        <span className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" /> Valor Fixo (R$)
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor do Desconto</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder={formData.discount_type === 'percentage' ? "10" : "5.00"}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor Mínimo do Pedido</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.min_order_value}
                    onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                    placeholder="Sem mínimo"
                  />
                </div>
                <div>
                  <Label>Desconto Máximo (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                    placeholder="Sem limite"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Útil para % (limita o valor)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Limite de Usos</Label>
                  <Input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="Ilimitado"
                  />
                </div>
                <div>
                  <Label>Válido Até</Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <Label className="cursor-pointer">Apenas primeira compra</Label>
                  </div>
                  <Switch
                    checked={formData.first_order_only}
                    onCheckedChange={(checked) => setFormData({ ...formData, first_order_only: checked })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Cupom válido apenas para clientes que nunca compraram
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Cupom Ativo</Label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCoupon ? "Salvar" : "Criar Cupom"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Ticket className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{coupons.length}</p>
                <p className="text-xs text-muted-foreground">Total de Cupons</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Check className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{coupons.filter(c => c.is_active).length}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{coupons.reduce((acc, c) => acc + c.used_count, 0)}</p>
                <p className="text-xs text-muted-foreground">Usos Totais</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Percent className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{coupons.filter(c => c.first_order_only).length}</p>
                <p className="text-xs text-muted-foreground">1ª Compra</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {coupons.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum cupom cadastrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie cupons para atrair e fidelizar seus clientes
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Regras</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded font-mono font-bold text-sm">
                            {coupon.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => copyCode(coupon.code)}
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                        {coupon.description && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-[150px] truncate">
                            {coupon.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-primary">
                          {coupon.discount_type === 'percentage' 
                            ? `${coupon.discount_value}%`
                            : formatCurrency(coupon.discount_value)
                          }
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {coupon.min_order_value && (
                            <Badge variant="outline" className="text-xs">
                              Min: {formatCurrency(coupon.min_order_value)}
                            </Badge>
                          )}
                          {coupon.max_discount && (
                            <Badge variant="outline" className="text-xs ml-1">
                              Max: {formatCurrency(coupon.max_discount)}
                            </Badge>
                          )}
                          {coupon.first_order_only && (
                            <Badge variant="secondary" className="text-xs block w-fit mt-1">
                              1ª compra
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {coupon.used_count} / {coupon.max_uses || '∞'}
                      </TableCell>
                      <TableCell>
                        {coupon.valid_until 
                          ? format(new Date(coupon.valid_until), "dd/MM/yyyy", { locale: ptBR })
                          : "Sem limite"
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={coupon.is_active ? "default" : "secondary"}>
                          {coupon.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(coupon)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => handleDelete(coupon.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommerceCoupons;
