import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Receipt, TrendingDown, DollarSign, Wallet, Package, CalendarIcon, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatCurrency";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CommerceExpensesProps {
  commerceId: string;
  monthlyRevenue: number;
  operatorFees?: number;
  productCost?: number;
  stockPurchasesTotal?: number;
}

interface Expense {
  id: string;
  name: string;
  type: 'fixed' | 'variable' | 'stock_purchase';
  amount: number;
  description: string | null;
  is_active: boolean;
  due_date: string | null;
  is_paid: boolean;
  paid_at: string | null;
}

const CommerceExpenses = ({ commerceId, monthlyRevenue, operatorFees = 0, productCost = 0, stockPurchasesTotal = 0 }: CommerceExpensesProps) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    type: 'fixed' as 'fixed' | 'variable' | 'stock_purchase',
    amount: '',
    description: '',
    due_date: null as Date | null
  });

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('commerce_id', commerceId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setExpenses(data as Expense[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, [commerceId]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.amount) {
      toast({ variant: "destructive", title: "Preencha nome e valor" });
      return;
    }

    const expenseData = {
      commerce_id: commerceId,
      name: formData.name,
      type: formData.type,
      amount: parseFloat(formData.amount),
      description: formData.description || null,
      due_date: formData.due_date ? format(formData.due_date, 'yyyy-MM-dd') : null
    };

    if (editingExpense) {
      const { error } = await supabase
        .from('expenses')
        .update(expenseData)
        .eq('id', editingExpense.id);

      if (error) {
        toast({ variant: "destructive", title: "Erro ao atualizar gasto" });
      } else {
        toast({ title: "Gasto atualizado!" });
      }
    } else {
      const { error } = await supabase
        .from('expenses')
        .insert(expenseData);

      if (error) {
        toast({ variant: "destructive", title: "Erro ao adicionar gasto" });
      } else {
        toast({ title: "Gasto adicionado!" });
      }
    }

    resetForm();
    fetchExpenses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este gasto?')) return;

    const { error } = await supabase
      .from('expenses')
      .update({ is_active: false })
      .eq('id', id);

    if (!error) {
      toast({ title: "Gasto removido!" });
      fetchExpenses();
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      name: expense.name,
      type: expense.type,
      amount: expense.amount.toString(),
      description: expense.description || '',
      due_date: expense.due_date ? new Date(expense.due_date + 'T12:00:00') : null
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', type: 'fixed', amount: '', description: '', due_date: null });
    setEditingExpense(null);
    setIsDialogOpen(false);
  };

  const handleMarkAsPaid = async (expenseId: string) => {
    const { error } = await supabase
      .from('expenses')
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq('id', expenseId);

    if (!error) {
      toast({ title: "Despesa marcada como paga!" });
      fetchExpenses();
    } else {
      toast({ variant: "destructive", title: "Erro ao marcar como pago" });
    }
  };

  const fixedExpenses = expenses.filter(e => e.type === 'fixed');
  const variableExpenses = expenses.filter(e => e.type === 'variable');
  const stockPurchaseExpenses = expenses.filter(e => e.type === 'stock_purchase');
  const totalFixedExpenses = fixedExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalVariableExpenses = variableExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalStockPurchases = stockPurchaseExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalExpenses = totalFixedExpenses + totalVariableExpenses + operatorFees;
  const netProfit = monthlyRevenue - totalExpenses;
  const finalProfit = netProfit - productCost;
  const profitMargin = monthlyRevenue > 0 ? (finalProfit / monthlyRevenue) * 100 : 0;
  const profitMarginWithoutCost = monthlyRevenue > 0 ? (netProfit / monthlyRevenue) * 100 : 0;
  // Valor disponível estoque = custo produtos vendidos - compras de estoque lançadas
  const stockAvailableValue = productCost - totalStockPurchases;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Faturamento Bruto</p>
                  <HelpTooltip content="Total de vendas realizadas no período selecionado" />
                </div>
                <p className="text-xl font-bold text-green-600">{formatCurrency(monthlyRevenue)}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Custos Totais</p>
                  <HelpTooltip content="Soma de gastos fixos, variáveis e taxas de operadoras" />
                </div>
                <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fixos: {formatCurrency(totalFixedExpenses)} | Var: {formatCurrency(totalVariableExpenses)} | Taxas: {formatCurrency(operatorFees)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-red-500/10">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-${netProfit >= 0 ? 'blue' : 'red'}-500/20 bg-${netProfit >= 0 ? 'blue' : 'red'}-500/5`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Lucro Líquido</p>
                  <HelpTooltip content="Faturamento menos todos os custos (fixos, variáveis e taxas)" />
                </div>
                <p className={`text-lg font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(netProfit)}
                </p>
                {productCost > 0 && (
                  <div className="mt-1 pt-1 border-t border-border/50">
                    <p className="text-xs text-muted-foreground flex justify-between">
                      <span>Custo produtos:</span>
                      <span className="text-red-500">- {formatCurrency(productCost)}</span>
                    </p>
                    <p className="text-xs font-medium flex justify-between mt-0.5">
                      <span>Lucro final:</span>
                      <span className={finalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(finalProfit)}
                      </span>
                    </p>
                  </div>
                )}
              </div>
              <div className={`p-2 rounded-lg ${netProfit >= 0 ? 'bg-blue-500/10' : 'bg-red-500/10'}`}>
                <Wallet className={`w-5 h-5 ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Margem Líquida</p>
                  <HelpTooltip content="Percentual do faturamento que sobra após todos os custos" />
                </div>
                <p className={`text-xl font-bold ${profitMargin >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                  {profitMargin.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">(com custo produtos)</p>
                <div className="mt-1 pt-1 border-t border-border/50">
                  <p className="text-xs text-muted-foreground flex justify-between">
                    <span>Sem custo produtos:</span>
                    <span className={profitMarginWithoutCost >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {profitMarginWithoutCost.toFixed(1)}%
                    </span>
                  </p>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Receipt className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card Valor Disponível Estoque */}
      {productCost > 0 && (
        <div className="grid grid-cols-1 gap-4">
          <Card className="border-cyan-500/20 bg-cyan-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">Valor Disponível Estoque</p>
                    <HelpTooltip content="Valor acumulado de custos de produtos vendidos menos as compras de estoque lançadas. Use para controlar quanto pode reinvestir em estoque." />
                  </div>
                  <p className={`text-xl font-bold ${stockAvailableValue >= 0 ? 'text-cyan-600' : 'text-red-600'}`}>
                    {formatCurrency(stockAvailableValue)}
                  </p>
                  <div className="mt-1 pt-1 border-t border-border/50">
                    <p className="text-xs text-muted-foreground flex justify-between">
                      <span>Custo produtos vendidos:</span>
                      <span className="text-green-600">+ {formatCurrency(productCost)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground flex justify-between mt-0.5">
                      <span>Compras de estoque:</span>
                      <span className="text-red-500">- {formatCurrency(totalStockPurchases)}</span>
                    </p>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Package className="w-5 h-5 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Expenses Management */}
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Receipt className="w-5 h-5 shrink-0" />
                <span>Gastos Fixos e Variáveis</span>
              </CardTitle>
              <CardDescription className="text-sm">Gerencie seus custos operacionais mensais</CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} size="sm" className="shrink-0 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Gasto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum gasto cadastrado</p>
              <p className="text-sm mt-2">Adicione gastos fixos (aluguel, internet) e variáveis (embalagens, etc.)</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => {
                  const today = new Date().toISOString().split('T')[0];
                  const isOverdue = expense.due_date && !expense.is_paid && expense.due_date < today;
                  const isPending = expense.due_date && !expense.is_paid && expense.due_date >= today;
                  
                  return (
                    <TableRow key={expense.id} className={isOverdue ? 'bg-red-500/5' : ''}>
                      <TableCell className="font-medium">{expense.name}</TableCell>
                      <TableCell>
                        <Badge variant={expense.type === 'fixed' ? 'default' : expense.type === 'stock_purchase' ? 'outline' : 'secondary'}
                          className={expense.type === 'stock_purchase' ? 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30' : ''}>
                          {expense.type === 'fixed' ? 'Fixo' : expense.type === 'stock_purchase' ? 'Compra Estoque' : 'Variável'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-red-600 font-medium">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {expense.due_date ? (
                          <span className={isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
                            {format(new Date(expense.due_date + 'T12:00:00'), 'dd/MM/yyyy')}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {expense.description || '-'}
                      </TableCell>
                      <TableCell>
                        {expense.is_paid ? (
                          <Badge className="bg-green-500/20 text-green-600">
                            <Check className="w-3 h-3 mr-1" />
                            Pago
                          </Badge>
                        ) : expense.due_date ? (
                          <Button 
                            size="sm" 
                            variant={isOverdue ? "destructive" : "outline"}
                            onClick={() => handleMarkAsPaid(expense.id)}
                            className="h-7 text-xs"
                          >
                            {isOverdue ? 'Pagar (Vencido)' : 'Pagar'}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem vencimento</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Editar Gasto' : 'Novo Gasto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Nome do Gasto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Aluguel, Internet, Embalagens"
              />
            </div>

            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'fixed' | 'variable' | 'stock_purchase') => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixo (recorrente todo mês)</SelectItem>
                  <SelectItem value="variable">Variável (varia conforme vendas)</SelectItem>
                  <SelectItem value="stock_purchase">Compra de Estoque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">
                {formData.type === 'fixed' ? 'Valor Mensal (R$)' : 'Valor (R$)'}
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Data de Vencimento (opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.due_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date ? (
                      format(formData.due_date, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.due_date || undefined}
                    onSelect={(date) => setFormData({ ...formData, due_date: date || null })}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes adicionais"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            <Button onClick={handleSubmit}>
              {editingExpense ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommerceExpenses;
