import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Package,
  Search,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  BarChart3,
  DollarSign,
  Boxes,
  RefreshCw,
  History,
  Plus,
  Minus,
  Lightbulb,
  ShoppingCart
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatCurrency";
import { HelpTooltip } from "@/components/ui/help-tooltip";

interface CommerceStockControlProps {
  commerceId: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  stock: number | null;
  is_active: boolean | null;
  image_url: string | null;
  category?: { name: string };
}

interface StockMovement {
  product_name: string;
  quantity: number;
  type: 'sold' | 'added' | 'adjusted';
  date: string;
}

interface StockStats {
  totalProducts: number;
  totalItems: number;
  totalCostValue: number;
  totalSaleValue: number;
  potentialProfit: number;
  lowStockCount: number;
  outOfStockCount: number;
  topStocked: { name: string; stock: number } | null;
  lowestStocked: { name: string; stock: number } | null;
  avgStockLevel: number;
}

const CommerceStockControl = ({ commerceId }: CommerceStockControlProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const { toast } = useToast();

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(name)')
      .eq('commerce_id', commerceId)
      .order('stock', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const fetchRecentSales = async () => {
    // Fetch recent sales from order_items to show stock movements
    const { data: orderItems } = await supabase
      .from('order_items')
      .select(`
        product_name,
        quantity,
        created_at,
        order:orders!inner(commerce_id, status)
      `)
      .eq('order.commerce_id', commerceId)
      .eq('order.status', 'delivered')
      .order('created_at', { ascending: false })
      .limit(10);

    if (orderItems) {
      const movements: StockMovement[] = orderItems.map(item => ({
        product_name: item.product_name,
        quantity: item.quantity,
        type: 'sold' as const,
        date: item.created_at
      }));
      setRecentMovements(movements);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchRecentSales();

    // Subscribe to product changes for real-time updates
    const channel = supabase
      .channel(`stock-control-${commerceId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'products',
          filter: `commerce_id=eq.${commerceId}` 
        },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [commerceId]);

  const calculateStats = (): StockStats => {
    let totalItems = 0;
    let totalCostValue = 0;
    let totalSaleValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((product) => {
      const stock = product.stock || 0;
      const cost = product.price || 0;
      const salePrice = product.promotional_price || 0;

      totalItems += stock;
      totalCostValue += cost * stock;
      totalSaleValue += salePrice * stock;

      if (stock === 0) outOfStockCount++;
      else if (stock <= 10) lowStockCount++;
    });

    const sortedByStock = [...products].sort((a, b) => (b.stock || 0) - (a.stock || 0));
    const topStocked = sortedByStock.length > 0 
      ? { name: sortedByStock[0].name, stock: sortedByStock[0].stock || 0 }
      : null;
    
    const sortedLowStock = [...products].filter(p => (p.stock || 0) > 0).sort((a, b) => (a.stock || 0) - (b.stock || 0));
    const lowestStocked = sortedLowStock.length > 0
      ? { name: sortedLowStock[0].name, stock: sortedLowStock[0].stock || 0 }
      : null;

    return {
      totalProducts: products.length,
      totalItems,
      totalCostValue,
      totalSaleValue,
      potentialProfit: totalSaleValue - totalCostValue,
      lowStockCount,
      outOfStockCount,
      topStocked,
      lowestStocked,
      avgStockLevel: products.length > 0 ? totalItems / products.length : 0,
    };
  };

  const stats = calculateStats();

  const handleAdjustStock = async () => {
    if (!selectedProduct || !stockAdjustment) return;

    const adjustment = parseInt(stockAdjustment);
    if (isNaN(adjustment) || adjustment <= 0) {
      toast({ variant: "destructive", title: "Quantidade inválida" });
      return;
    }

    const currentStock = selectedProduct.stock || 0;
    const newStock = adjustmentType === 'add' 
      ? currentStock + adjustment 
      : Math.max(0, currentStock - adjustment);

    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', selectedProduct.id);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao ajustar estoque", description: error.message });
    } else {
      toast({ 
        title: "Estoque atualizado!", 
        description: `${selectedProduct.name}: ${currentStock} → ${newStock} unidades` 
      });
      setIsAdjustDialogOpen(false);
      setSelectedProduct(null);
      setStockAdjustment("");
      fetchProducts();
    }
  };

  const openAdjustDialog = (product: Product, type: 'add' | 'remove') => {
    setSelectedProduct(product);
    setAdjustmentType(type);
    setStockAdjustment("");
    setIsAdjustDialogOpen(true);
  };

  const getStockStatus = (stock: number | null): { label: string; color: string } => {
    const s = stock ?? 0;
    if (s === 0) return { label: 'Esgotado', color: 'bg-red-500/20 text-red-500' };
    if (s <= 5) return { label: 'Crítico', color: 'bg-red-500/20 text-red-500' };
    if (s <= 10) return { label: 'Baixo', color: 'bg-yellow-500/20 text-yellow-500' };
    if (s <= 30) return { label: 'Normal', color: 'bg-blue-500/20 text-blue-500' };
    return { label: 'Alto', color: 'bg-green-500/20 text-green-500' };
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate insights based on real data
  const generateInsights = (): string[] => {
    const insights: string[] = [];
    
    if (stats.outOfStockCount > 0) {
      insights.push(`⚠️ ${stats.outOfStockCount} produto(s) sem estoque - podem estar perdendo vendas`);
    }
    
    if (stats.lowStockCount > 0) {
      insights.push(`🔔 ${stats.lowStockCount} produto(s) com estoque baixo (≤10 un.) - considere reabastecer`);
    }

    const highValueProducts = products.filter(p => {
      const stockValue = (p.promotional_price || 0) * (p.stock || 0);
      return stockValue > stats.totalSaleValue * 0.3;
    });
    
    if (highValueProducts.length > 0) {
      insights.push(`💰 ${highValueProducts[0].name} concentra grande parte do valor em estoque`);
    }

    if (stats.avgStockLevel < 20) {
      insights.push(`📦 Estoque médio baixo (${stats.avgStockLevel.toFixed(0)} un.) - monitore reposição`);
    }

    if (insights.length === 0) {
      insights.push(`✅ Estoque saudável - continue monitorando regularmente`);
    }

    return insights;
  };

  const insights = generateInsights();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Controle de Estoque</h1>
          <p className="text-muted-foreground">Gerencie níveis de estoque, ajustes e movimentações</p>
        </div>
        <Button variant="outline" onClick={() => { fetchProducts(); fetchRecentSales(); }} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Total de Itens</p>
                  <HelpTooltip content="Soma de todas as unidades em estoque de todos os produtos" />
                </div>
                <p className="text-2xl font-bold text-blue-500">
                  {stats.totalItems.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground">
                  em {stats.totalProducts} produtos
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Boxes className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Valor em Estoque</p>
                  <HelpTooltip content="Valor total do estoque calculado pelo preço de venda de cada produto" />
                </div>
                <p className="text-2xl font-bold text-green-500">
                  {formatCurrency(stats.totalSaleValue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Custo: {formatCurrency(stats.totalCostValue)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Estoque Baixo</p>
                  <HelpTooltip content="Produtos com 10 ou menos unidades que precisam de reposição" />
                </div>
                <p className="text-2xl font-bold text-yellow-500">
                  {stats.lowStockCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  produtos ≤10 un.
                </p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Sem Estoque</p>
                  <HelpTooltip content="Produtos esgotados que não podem ser vendidos - reposição urgente" />
                </div>
                <p className="text-2xl font-bold text-red-500">
                  {stats.outOfStockCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  produtos zerados
                </p>
              </div>
              <div className="p-2 rounded-lg bg-red-500/10">
                <Package className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Lucro Potencial</p>
                  <HelpTooltip content="Lucro que você obteria se vendesse todo o estoque atual" />
                </div>
                <p className="text-xl font-bold text-purple-500">
                  {formatCurrency(stats.potentialProfit)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Média por Produto</p>
                  <HelpTooltip content="Quantidade média de unidades em estoque por produto" />
                </div>
                <p className="text-xl font-bold">{stats.avgStockLevel.toFixed(0)} un.</p>
              </div>
              <div className="p-2 rounded-lg bg-muted">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <ArrowUpCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Maior Estoque</p>
                  <HelpTooltip content="Produto com mais unidades disponíveis" />
                </div>
                <p className="text-sm font-medium truncate">
                  {stats.topStocked?.name || "-"}
                </p>
                <p className="text-xs text-green-500">
                  {stats.topStocked?.stock || 0} unidades
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <ArrowDownCircle className="w-5 h-5 text-orange-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Menor Estoque</p>
                  <HelpTooltip content="Produto disponível com menos unidades" />
                </div>
                <p className="text-sm font-medium truncate">
                  {stats.lowestStocked?.name || "-"}
                </p>
                <p className="text-xs text-orange-500">
                  {stats.lowestStocked?.stock || 0} unidades
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Insights de Estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <p key={index} className="text-sm">{insight}</p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Movimentações Recentes */}
      {recentMovements.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-muted-foreground" />
              Últimas Vendas (Saídas de Estoque)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentMovements.slice(0, 5).map((movement, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded bg-red-500/10">
                      <ShoppingCart className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{movement.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(movement.date).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(movement.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-red-500">
                    -{movement.quantity} un.
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Produtos com Estoque */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum produto encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor Custo</TableHead>
                  <TableHead>Valor Venda</TableHead>
                  <TableHead className="text-right">Ajustar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const stock = product.stock ?? 0;
                  const stockStatus = getStockStatus(stock);
                  const costValue = (product.price || 0) * stock;
                  const saleValue = (product.promotional_price || 0) * stock;

                  return (
                    <TableRow key={product.id} className={stock === 0 ? 'bg-red-500/5' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              <Package className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.category?.name || "-"}
                      </TableCell>
                      <TableCell>
                        <span className="text-lg font-bold">{stock}</span>
                        <span className="text-muted-foreground ml-1">un.</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={stockStatus.color}>
                          {stockStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatCurrency(costValue)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(saleValue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAdjustDialog(product, 'add')}
                            className="gap-1"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAdjustDialog(product, 'remove')}
                            className="gap-1"
                            disabled={stock === 0}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Ajuste de Estoque */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustmentType === 'add' ? 'Adicionar ao Estoque' : 'Remover do Estoque'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedProduct && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedProduct.name}</p>
                <p className="text-sm text-muted-foreground">
                  Estoque atual: <span className="font-medium">{selectedProduct.stock || 0} unidades</span>
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="adjustment">Quantidade</Label>
              <Input
                id="adjustment"
                type="number"
                min="1"
                value={stockAdjustment}
                onChange={(e) => setStockAdjustment(e.target.value)}
                placeholder="Digite a quantidade"
              />
            </div>
            {selectedProduct && stockAdjustment && parseInt(stockAdjustment) > 0 && (
              <div className={`p-3 rounded-lg ${adjustmentType === 'add' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                <p className="text-sm">
                  Novo estoque:{' '}
                  <span className="font-bold">
                    {adjustmentType === 'add'
                      ? (selectedProduct.stock || 0) + parseInt(stockAdjustment)
                      : Math.max(0, (selectedProduct.stock || 0) - parseInt(stockAdjustment))
                    } unidades
                  </span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdjustStock} disabled={!stockAdjustment || parseInt(stockAdjustment) <= 0}>
              {adjustmentType === 'add' ? 'Adicionar' : 'Remover'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommerceStockControl;
