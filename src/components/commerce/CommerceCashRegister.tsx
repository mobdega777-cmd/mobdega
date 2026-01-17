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
  Smartphone
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
  const [loading, setLoading] = useState(true);
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [openingAmount, setOpeningAmount] = useState("");
  const [closingAmount, setClosingAmount] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  
  const [movementForm, setMovementForm] = useState({
    type: "deposit",
    amount: "",
    payment_method: "cash",
    description: "",
  });

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
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [commerceId]);

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

  const addMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentRegister) return;

    const { error } = await supabase
      .from('cash_movements')
      .insert({
        cash_register_id: currentRegister.id,
        commerce_id: commerceId,
        type: movementForm.type,
        amount: parseFloat(movementForm.amount),
        payment_method: movementForm.payment_method,
        description: movementForm.description || null,
        created_by: user.id,
      });

    if (error) {
      toast({ variant: "destructive", title: "Erro ao registrar movimentação", description: error.message });
    } else {
      toast({ title: "Movimentação registrada!" });
      setIsMovementDialogOpen(false);
      setMovementForm({
        type: "deposit",
        amount: "",
        payment_method: "cash",
        description: "",
      });
      fetchData();
    }
  };

  const calculateTotals = () => {
    const sales = movements.filter(m => m.type === 'sale').reduce((sum, m) => sum + Number(m.amount), 0);
    const deposits = movements.filter(m => m.type === 'deposit').reduce((sum, m) => sum + Number(m.amount), 0);
    const withdrawals = movements.filter(m => m.type === 'withdrawal').reduce((sum, m) => sum + Number(m.amount), 0);
    const expenses = movements.filter(m => m.type === 'expense').reduce((sum, m) => sum + Number(m.amount), 0);
    const opening = currentRegister ? Number(currentRegister.opening_amount) : 0;
    const cashInRegister = opening + deposits - withdrawals - expenses + 
      movements.filter(m => m.type === 'sale' && m.payment_method === 'cash').reduce((sum, m) => sum + Number(m.amount), 0);

    return { sales, deposits, withdrawals, expenses, cashInRegister };
  };

  const totals = calculateTotals();

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
          <div className="flex gap-2">
            <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Movimentação
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Movimentação</DialogTitle>
                </DialogHeader>
                <form onSubmit={addMovement} className="space-y-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select
                      value={movementForm.type}
                      onValueChange={(value) => setMovementForm({ ...movementForm, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deposit">Entrada/Suprimento</SelectItem>
                        <SelectItem value="withdrawal">Sangria</SelectItem>
                        <SelectItem value="expense">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Valor (R$)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={movementForm.amount}
                      onChange={(e) => setMovementForm({ ...movementForm, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Forma de Pagamento</Label>
                    <Select
                      value={movementForm.payment_method}
                      onValueChange={(value) => setMovementForm({ ...movementForm, payment_method: value })}
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
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      value={movementForm.description}
                      onChange={(e) => setMovementForm({ ...movementForm, description: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsMovementDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Registrar</Button>
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
          </div>
        )}
      </div>

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
              {movements.length === 0 ? (
                <div className="text-center py-8">
                  <Calculator className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma movimentação registrada</p>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => {
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
