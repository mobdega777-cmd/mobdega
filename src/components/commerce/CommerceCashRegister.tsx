import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { 
  Calculator, 
  DollarSign, 
  Plus, 
  Minus,
  Clock,
  CheckCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Banknote,
  CreditCard,
  Smartphone,
  ShoppingCart,
  Search,
  Pencil,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import DateFilter, { getDateRange } from "./DateFilter";
import { startOfDay, endOfDay } from "date-fns";

interface CommerceCashRegisterProps {
  commerceId: string;
}

interface CashRegister {
  id: string;
  opening_amount: number;
  closing_amount: number | null;
  expected_amount: number | null;
  difference: number | null;
  opened_at: string;
  closed_at: string | null;
  status: string;
  notes: string | null;
}

interface CashMovement {
  id: string;
  type: string;
  amount: number;
  payment_method: string;
  description: string | null;
  created_at: string;
  order_id: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  promotional_price: number | null;
  stock: number | null;
}

const paymentMethods = [
  { value: 'cash', label: 'Dinheiro', icon: Banknote },
  { value: 'credit', label: 'Crédito', icon: CreditCard },
  { value: 'debit', label: 'Débito', icon: CreditCard },
  { value: 'pix', label: 'PIX', icon: Smartphone },
];

const CommerceCashRegister = ({ commerceId }: CommerceCashRegisterProps) => {
  const [currentRegister, setCurrentRegister] = useState<CashRegister | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<CashMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [isEditMovementDialogOpen, setIsEditMovementDialogOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<CashMovement | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Date filter state
  const [dateFilter, setDateFilter] = useState({ 
    start: startOfDay(new Date()), 
    end: endOfDay(new Date()) 
  });

  const [openingAmount, setOpeningAmount] = useState("");
  const [closingAmount, setClosingAmount] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [amountPaid, setAmountPaid] = useState("");
  
  const [saleForm, setSaleForm] = useState({
    product_id: "",
    amount: "",
    payment_method: "cash",
    quantity: "1",
  });

  const [editForm, setEditForm] = useState({
    amount: "",
    payment_method: "cash",
  });

  const handleDateChange = (start: Date, end: Date) => {
    setDateFilter({ start, end });
  };

  const fetchData = async () => {
    // Fetch current open register
    const { data: register } = await supabase
      .from('cash_registers')
      .select('*')
      .eq('commerce_id', commerceId)
      .eq('status', 'open')
      .maybeSingle();

    setCurrentRegister(register);

    if (register) {
      // Fetch movements for this register
      const { data: movementsData } = await supabase
        .from('cash_movements')
        .select('*')
        .eq('cash_register_id', register.id)
        .order('created_at', { ascending: false });

      setMovements(movementsData || []);
    } else {
      // Fetch all movements for filtering when register is closed
      const { data: allMovements } = await supabase
        .from('cash_movements')
        .select('*')
        .eq('commerce_id', commerceId)
        .order('created_at', { ascending: false });

      setMovements(allMovements || []);
    }

    // Fetch products
    const { data: productsData } = await supabase
      .from('products')
      .select('id, name, price, promotional_price, stock')
      .eq('commerce_id', commerceId)
      .eq('is_active', true)
      .order('name');

    setProducts(productsData || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [commerceId]);

  // Filter movements by date
  useEffect(() => {
    if (currentRegister) {
      // When register is open, show only today's movements from that register
      const todayMovements = movements.filter(m => {
        const movementDate = new Date(m.created_at);
        return movementDate >= dateFilter.start && movementDate <= dateFilter.end;
      });
      setFilteredMovements(todayMovements);
    } else {
      // When register is closed, filter by selected date range
      const filtered = movements.filter(m => {
        const movementDate = new Date(m.created_at);
        return movementDate >= dateFilter.start && movementDate <= dateFilter.end;
      });
      setFilteredMovements(filtered);
    }
  }, [movements, dateFilter, currentRegister]);

  const openCashRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase
      .from('cash_registers')
      .insert({
        commerce_id: commerceId,
        opened_by: user.id,
        opening_amount: parseFloat(openingAmount) || 0,
      });

    if (error) {
      toast({ variant: "destructive", title: "Erro ao abrir caixa", description: error.message });
    } else {
      toast({ title: "Caixa aberto com sucesso!" });
      setIsOpenDialogOpen(false);
      setOpeningAmount("");
      fetchData();
    }
  };

  const closeCashRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentRegister) return;

    // Calculate expected amount
    const cashSales = movements
      .filter(m => m.type === 'sale' && m.payment_method === 'cash')
      .reduce((sum, m) => sum + Number(m.amount), 0);
    
    const deposits = movements
      .filter(m => m.type === 'deposit')
      .reduce((sum, m) => sum + Number(m.amount), 0);
    
    const withdrawals = movements
      .filter(m => m.type === 'withdrawal' || m.type === 'expense')
      .reduce((sum, m) => sum + Number(m.amount), 0);

    const expectedAmount = Number(currentRegister.opening_amount) + cashSales + deposits - withdrawals;
    const closingAmountNum = parseFloat(closingAmount) || 0;
    const difference = closingAmountNum - expectedAmount;

    const { error } = await supabase
      .from('cash_registers')
      .update({
        closed_by: user.id,
        closing_amount: closingAmountNum,
        expected_amount: expectedAmount,
        difference: difference,
        closed_at: new Date().toISOString(),
        status: 'closed',
        notes: closingNotes || null,
      })
      .eq('id', currentRegister.id);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao fechar caixa", description: error.message });
    } else {
      toast({ title: "Caixa fechado com sucesso!" });
      setIsCloseDialogOpen(false);
      setClosingAmount("");
      setClosingNotes("");
      fetchData();
    }
  };

  const addSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentRegister || !selectedProduct) return;

    const saleAmount = parseFloat(saleForm.amount);
    const quantity = parseInt(saleForm.quantity) || 1;

    // Update product stock
    if (selectedProduct.stock !== null) {
      await supabase
        .from('products')
        .update({ stock: selectedProduct.stock - quantity })
        .eq('id', selectedProduct.id);
    }

    // Create order for this sale
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        commerce_id: commerceId,
        user_id: user.id,
        order_type: 'pos',
        status: 'delivered',
        subtotal: saleAmount,
        total: saleAmount,
        payment_method: saleForm.payment_method,
        customer_name: 'Venda PDV',
        delivered_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
    } else {
      // Create order item
      await supabase
        .from('order_items')
        .insert({
          order_id: orderData.id,
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          quantity: quantity,
          unit_price: selectedProduct.promotional_price || selectedProduct.price,
          total_price: saleAmount,
        });
    }

    const { error } = await supabase
      .from('cash_movements')
      .insert({
        cash_register_id: currentRegister.id,
        commerce_id: commerceId,
        type: 'sale',
        amount: saleAmount,
        payment_method: saleForm.payment_method,
        description: `Venda: ${selectedProduct.name} (x${quantity})`,
        created_by: user.id,
        order_id: orderData?.id || null,
      });

    if (error) {
      toast({ variant: "destructive", title: "Erro ao registrar venda", description: error.message });
    } else {
      toast({ title: "Venda registrada!" });
      setIsSaleDialogOpen(false);
      resetSaleForm();
      fetchData();
    }
  };

  const resetSaleForm = () => {
    setSaleForm({
      product_id: "",
      amount: "",
      payment_method: "cash",
      quantity: "1",
    });
    setSelectedProduct(null);
    setProductSearch("");
    setAmountPaid("");
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    const salePrice = product.promotional_price || product.price;
    setSaleForm({
      ...saleForm,
      product_id: product.id,
      amount: salePrice.toString(),
    });
    setProductSearch(product.name);
  };

  const updateSaleAmount = (quantity: string) => {
    const qty = parseInt(quantity) || 1;
    if (selectedProduct) {
      const salePrice = selectedProduct.promotional_price || selectedProduct.price;
      setSaleForm({
        ...saleForm,
        quantity,
        amount: (salePrice * qty).toString(),
      });
    } else {
      setSaleForm({ ...saleForm, quantity });
    }
  };

  // Cálculo de troco
  const calculateChange = (): number => {
    const paid = parseFloat(amountPaid) || 0;
    const total = parseFloat(saleForm.amount) || 0;
    return paid - total;
  };

  const change = calculateChange();

  const handleEditMovement = (movement: CashMovement) => {
    setEditingMovement(movement);
    setEditForm({
      amount: movement.amount.toString(),
      payment_method: movement.payment_method,
    });
    setIsEditMovementDialogOpen(true);
  };

  const updateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovement) return;

    const { error } = await supabase
      .from('cash_movements')
      .update({
        amount: parseFloat(editForm.amount),
        payment_method: editForm.payment_method,
      })
      .eq('id', editingMovement.id);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar movimentação", description: error.message });
    } else {
      toast({ title: "Movimentação atualizada!" });
      setIsEditMovementDialogOpen(false);
      setEditingMovement(null);
      fetchData();
    }
  };

  const deleteMovement = async (movementId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta movimentação?')) return;

    const { error } = await supabase
      .from('cash_movements')
      .delete()
      .eq('id', movementId);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao excluir movimentação", description: error.message });
    } else {
      toast({ title: "Movimentação excluída!" });
      fetchData();
    }
  };

  const calculateTotals = () => {
    const movementsToCalculate = currentRegister ? movements : filteredMovements;
    const sales = movementsToCalculate.filter(m => m.type === 'sale').reduce((sum, m) => sum + Number(m.amount), 0);
    const deposits = movementsToCalculate.filter(m => m.type === 'deposit').reduce((sum, m) => sum + Number(m.amount), 0);
    const withdrawals = movementsToCalculate.filter(m => m.type === 'withdrawal').reduce((sum, m) => sum + Number(m.amount), 0);
    const expenses = movementsToCalculate.filter(m => m.type === 'expense').reduce((sum, m) => sum + Number(m.amount), 0);
    const opening = currentRegister ? Number(currentRegister.opening_amount) : 0;
    const cashInRegister = opening + deposits - withdrawals - expenses + 
      movementsToCalculate.filter(m => m.type === 'sale' && m.payment_method === 'cash').reduce((sum, m) => sum + Number(m.amount), 0);

    return { sales, deposits, withdrawals, expenses, cashInRegister };
  };

  const totals = calculateTotals();

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold">Caixa/PDV</h1>
          <p className="text-muted-foreground">Controle de caixa e movimentações</p>
        </div>
        <div className="flex items-center gap-2">
          <DateFilter onDateChange={handleDateChange} defaultValue="today" />
          
          {!currentRegister ? (
            <Dialog open={isOpenDialogOpen} onOpenChange={setIsOpenDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-green-600 hover:bg-green-700">
                  <Calculator className="w-4 h-4" />
                  Abrir Caixa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Abrir Caixa</DialogTitle>
                </DialogHeader>
                <form onSubmit={openCashRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="opening_amount">Valor de Abertura (R$)</Label>
                    <Input
                      id="opening_amount"
                      type="number"
                      step="0.01"
                      value={openingAmount}
                      onChange={(e) => setOpeningAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsOpenDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Abrir Caixa</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <>
              {/* Lançar Venda Dialog */}
              <Dialog open={isSaleDialogOpen} onOpenChange={(open) => {
                setIsSaleDialogOpen(open);
                if (!open) resetSaleForm();
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Lançar Venda
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Lançar Venda</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={addSale} className="space-y-4">
                    <div>
                      <Label>Produto</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            if (selectedProduct && e.target.value !== selectedProduct.name) {
                              setSelectedProduct(null);
                              setSaleForm({ ...saleForm, product_id: "", amount: "" });
                            }
                          }}
                          placeholder="Buscar produto..."
                          className="pl-10"
                        />
                      </div>
                      {productSearch && !selectedProduct && (
                        <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg">
                          {filteredProducts.length === 0 ? (
                            <p className="text-sm text-muted-foreground p-3">Nenhum produto encontrado</p>
                          ) : (
                            filteredProducts.map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                className="w-full p-3 text-left hover:bg-muted/50 flex justify-between items-center border-b last:border-b-0"
                                onClick={() => handleSelectProduct(product)}
                              >
                                <span>{product.name}</span>
                                <span className="text-primary font-medium">
                                  R$ {(product.promotional_price || product.price).toFixed(2)}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                      {selectedProduct && (
                        <p className="text-sm text-green-600 mt-1">
                          ✓ Produto selecionado: R$ {(selectedProduct.promotional_price || selectedProduct.price).toFixed(2)} / un
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          min="1"
                          value={saleForm.quantity}
                          onChange={(e) => updateSaleAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Valor Total (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={saleForm.amount}
                          onChange={(e) => setSaleForm({ ...saleForm, amount: e.target.value })}
                          readOnly={!!selectedProduct}
                          className={selectedProduct ? "bg-muted" : ""}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Forma de Pagamento</Label>
                      <Select
                        value={saleForm.payment_method}
                        onValueChange={(value) => setSaleForm({ ...saleForm, payment_method: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sistema de Troco - apenas para Dinheiro */}
                    {saleForm.payment_method === 'cash' && saleForm.amount && (
                      <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                        <div>
                          <Label>Valor Pago (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            placeholder="Valor recebido do cliente"
                          />
                        </div>
                        {amountPaid && (
                          <div className={`p-3 rounded-lg ${change >= 0 ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                            <p className="text-sm text-muted-foreground">Troco a devolver</p>
                            <p className={`text-2xl font-bold ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              R$ {change.toFixed(2)}
                            </p>
                            {change < 0 && (
                              <p className="text-xs text-red-500 mt-1">Valor insuficiente!</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => {
                        setIsSaleDialogOpen(false);
                        resetSaleForm();
                      }}>
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={!selectedProduct || !saleForm.amount || (saleForm.payment_method === 'cash' && amountPaid && change < 0)}
                      >
                        Registrar Venda
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-red-600 hover:bg-red-700">
                    <Clock className="w-4 h-4" />
                    Fechar Caixa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Fechar Caixa</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={closeCashRegister} className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground">Valor esperado em caixa</p>
                      <p className="text-2xl font-bold">R$ {totals.cashInRegister.toFixed(2)}</p>
                    </div>
                    <div>
                      <Label htmlFor="closing_amount">Valor Contado (R$)</Label>
                      <Input
                        id="closing_amount"
                        type="number"
                        step="0.01"
                        value={closingAmount}
                        onChange={(e) => setClosingAmount(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        value={closingNotes}
                        onChange={(e) => setClosingNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCloseDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" variant="destructive">Fechar Caixa</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Edit Movement Dialog */}
      <Dialog open={isEditMovementDialogOpen} onOpenChange={setIsEditMovementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Movimentação</DialogTitle>
          </DialogHeader>
          <form onSubmit={updateMovement} className="space-y-4">
            <div>
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Select
                value={editForm.payment_method}
                onValueChange={(value) => setEditForm({ ...editForm, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditMovementDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {currentRegister && (
        <>
          {/* Status Card */}
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/20">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Caixa Aberto</p>
                  <p className="font-medium">
                    Aberto em {new Date(currentRegister.opened_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm text-muted-foreground">Valor de Abertura</p>
                  <p className="text-xl font-bold">R$ {Number(currentRegister.opening_amount).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <ArrowUpCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Vendas</p>
                    <p className="text-lg font-bold">R$ {totals.sales.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Plus className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Entradas</p>
                    <p className="text-lg font-bold">R$ {totals.deposits.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Minus className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Sangrias</p>
                    <p className="text-lg font-bold">R$ {totals.withdrawals.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Em Caixa</p>
                    <p className="text-lg font-bold text-primary">R$ {totals.cashInRegister.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Movements Table */}
          <Card>
            <CardHeader>
              <CardTitle>Movimentações</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredMovements.length === 0 ? (
                <div className="text-center py-8">
                  <Calculator className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma movimentação no período selecionado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Forma Pgto.</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.map((movement) => {
                      const isIncome = movement.type === 'sale' || movement.type === 'deposit';
                      const typeLabels: Record<string, string> = {
                        sale: 'Venda',
                        deposit: 'Entrada',
                        withdrawal: 'Sangria',
                        expense: 'Despesa',
                      };
                      const method = paymentMethods.find(m => m.value === movement.payment_method);

                      return (
                        <TableRow key={movement.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isIncome ? (
                                <ArrowUpCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <ArrowDownCircle className="w-4 h-4 text-red-500" />
                              )}
                              {typeLabels[movement.type]}
                            </div>
                          </TableCell>
                          <TableCell>{movement.description || '-'}</TableCell>
                          <TableCell>{method?.label || movement.payment_method}</TableCell>
                          <TableCell className={isIncome ? 'text-green-500' : 'text-red-500'}>
                            {isIncome ? '+' : '-'} R$ {Number(movement.amount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(movement.created_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditMovement(movement)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMovement(movement.id)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
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
        </>
      )}

      {!currentRegister && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calculator className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold mb-2">Caixa Fechado</h3>
            <p className="text-muted-foreground mb-4">
              Abra o caixa para começar a registrar vendas e movimentações
            </p>
            <Button onClick={() => setIsOpenDialogOpen(true)} className="gap-2">
              <Calculator className="w-4 h-4" />
              Abrir Caixa
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CommerceCashRegister;
