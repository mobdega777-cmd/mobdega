import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Trash2,
  UtensilsCrossed,
  XCircle,
  User,
  Phone,
  Eye,
  Percent,
  AlertTriangle,
  Users,
  Receipt
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import DateFilter, { getDateRange } from "./DateFilter";
import { startOfDay, endOfDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { HelpTooltip } from "@/components/ui/help-tooltip";

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

interface TableParticipant {
  id: string;
  user_id: string;
  customer_name: string | null;
  is_host: boolean;
  bill_requested: boolean;
  bill_requested_at: string | null;
}

interface TableSession {
  id: string;
  bill_mode: 'single' | 'split';
  status: string;
  participants: TableParticipant[];
}

interface ParticipantOrder {
  participant: TableParticipant;
  items: {
    id?: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_id?: string | null;
  }[];
  total: number;
  order_ids: string[];
}

interface TableOrder {
  id: string;
  table_id: string;
  table_number: number;
  table_name: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  created_at: string;
  total: number;
  status: string;
  payment_method: string | null;
  all_order_ids?: string[];
  session?: TableSession | null;
  participantOrders?: ParticipantOrder[];
  hasBillRequests?: boolean;
  items: {
    id?: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_id?: string | null;
    user_id?: string;
  }[];
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
  const [tableOrders, setTableOrders] = useState<TableOrder[]>([]);
  const [paymentMethodsConfig, setPaymentMethodsConfig] = useState<Array<{
    type: string;
    fee_percentage: number;
    fee_fixed: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [isEditMovementDialogOpen, setIsEditMovementDialogOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<CashMovement | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Table order modals
  const [selectedTableOrder, setSelectedTableOrder] = useState<TableOrder | null>(null);
  const [showTableOrderModal, setShowTableOrderModal] = useState(false);
  const [showCloseTableModal, setShowCloseTableModal] = useState(false);
  const [tablePaymentMethod, setTablePaymentMethod] = useState<string>("cash");
  const [tableCashReceived, setTableCashReceived] = useState("");
  
  // Individual participant closing (for split bills)
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantOrder | null>(null);
  const [showCloseParticipantModal, setShowCloseParticipantModal] = useState(false);
  const [participantPaymentMethod, setParticipantPaymentMethod] = useState<string>("cash");
  const [participantCashReceived, setParticipantCashReceived] = useState("");

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

  // Fetch table orders with pending payment (status = delivered, payment_method = pending, order_type = table)
    const { data: tableOrdersData } = await supabase
      .from('orders')
      .select(`
        id,
        table_id,
        user_id,
        session_id,
        customer_name,
        customer_phone,
        created_at,
        total,
        status,
        payment_method,
        order_items (
          id,
          product_name,
          quantity,
          unit_price,
          total_price,
          product_id
        )
      `)
      .eq('commerce_id', commerceId)
      .eq('order_type', 'table')
      .eq('payment_method', 'pending')
      .in('status', ['pending', 'confirmed', 'preparing', 'delivered'])
      .order('created_at', { ascending: false });

    // Fetch table details for the orders
    if (tableOrdersData && tableOrdersData.length > 0) {
      const tableIds = [...new Set(tableOrdersData.map(o => o.table_id).filter(Boolean))];
      const { data: tablesData } = await supabase
        .from('tables')
        .select('id, number, name, session_id')
        .in('id', tableIds);

      const tableMap = new Map(tablesData?.map(t => [t.id, t]) || []);

      // Fetch sessions for these tables
      const sessionIds = [...new Set(tablesData?.map(t => t.session_id).filter(Boolean) || [])];
      let sessionsMap = new Map<string, TableSession>();
      
      if (sessionIds.length > 0) {
        const { data: sessionsData } = await supabase
          .from('table_sessions')
          .select('id, bill_mode, status')
          .in('id', sessionIds)
          .eq('status', 'active');

        if (sessionsData) {
          // Fetch participants for these sessions
          const { data: participantsData } = await supabase
            .from('table_participants')
            .select('id, session_id, user_id, customer_name, is_host, bill_requested, bill_requested_at')
            .in('session_id', sessionIds);

          sessionsData.forEach(session => {
            const participants = participantsData?.filter(p => p.session_id === session.id) || [];
            sessionsMap.set(session.id, {
              id: session.id,
              bill_mode: session.bill_mode as 'single' | 'split',
              status: session.status,
              participants: participants.map(p => ({
                id: p.id,
                user_id: p.user_id,
                customer_name: p.customer_name,
                is_host: p.is_host,
                bill_requested: p.bill_requested ?? false,
                bill_requested_at: p.bill_requested_at
              }))
            });
          });
        }
      }

      // Consolidar pedidos por mesa - agrupar itens de múltiplos pedidos na mesma mesa
      const ordersByTable = new Map<string, TableOrder & { all_order_ids: string[] }>();
      
      tableOrdersData.forEach(order => {
        const table = tableMap.get(order.table_id);
        const tableKey = order.table_id || order.id;
        const session = table?.session_id ? sessionsMap.get(table.session_id) : null;
        
        // Add user_id to each item for participant filtering
        const itemsWithUserId = (order.order_items || []).map(item => ({
          ...item,
          user_id: order.user_id
        }));
        
        if (ordersByTable.has(tableKey)) {
          // Mesa já existe - adicionar itens e somar total
          const existingOrder = ordersByTable.get(tableKey)!;
          existingOrder.items = [...existingOrder.items, ...itemsWithUserId];
          existingOrder.total = Number(existingOrder.total) + Number(order.total);
          existingOrder.all_order_ids.push(order.id);
          // Manter o status MENOS avançado para não habilitar fechamento antes de todos estarem prontos
          const statusPriority: Record<string, number> = { pending: 1, confirmed: 2, preparing: 3, delivered: 4 };
          if (statusPriority[order.status] < statusPriority[existingOrder.status]) {
            existingOrder.status = order.status;
          }
        } else {
          // Nova mesa
          const hasBillRequests = session?.participants.some(p => p.bill_requested) || false;
          
          ordersByTable.set(tableKey, {
            id: order.id,
            table_id: order.table_id || '',
            table_number: table?.number || 0,
            table_name: table?.name || null,
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            created_at: order.created_at,
            total: order.total,
            status: order.status,
            payment_method: order.payment_method,
            items: itemsWithUserId,
            all_order_ids: [order.id],
            session: session || null,
            hasBillRequests
          });
        }
      });

      // For split bill mode, group items by participant
      const finalOrders = Array.from(ordersByTable.values()).map(tableOrder => {
        if (tableOrder.session?.bill_mode === 'split') {
          const participantOrdersMap = new Map<string, ParticipantOrder>();
          
          tableOrder.session.participants.forEach(participant => {
            const participantItems = tableOrder.items.filter(item => item.user_id === participant.user_id);
            const participantTotal = participantItems.reduce((sum, item) => sum + Number(item.total_price), 0);
            const participantOrderIds = [...new Set(
              tableOrdersData
                .filter(o => o.table_id === tableOrder.table_id && o.user_id === participant.user_id)
                .map(o => o.id)
            )];
            
            if (participantItems.length > 0) {
              participantOrdersMap.set(participant.user_id, {
                participant,
                items: participantItems,
                total: participantTotal,
                order_ids: participantOrderIds
              });
            }
          });
          
          tableOrder.participantOrders = Array.from(participantOrdersMap.values());
        }
        
        return tableOrder;
      });

      setTableOrders(finalOrders);
    } else {
      setTableOrders([]);
    }

    // Fetch payment methods config for fee calculation
    const { data: paymentMethodsData } = await supabase
      .from('payment_methods')
      .select('type, fee_percentage, fee_fixed')
      .eq('commerce_id', commerceId);

    setPaymentMethodsConfig(paymentMethodsData || []);

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

    // Stock deduction is now handled by the database trigger when order status becomes 'delivered'
    // No need for manual stock deduction here

    // Create order for this sale (status=delivered triggers stock deduction automatically)
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
      // Create order item (the trigger will deduct stock based on this)
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
    // Always use filteredMovements to respect date filter
    const movementsToCalculate = filteredMovements;
    const sales = movementsToCalculate.filter(m => m.type === 'sale').reduce((sum, m) => sum + Number(m.amount), 0);
    const deposits = movementsToCalculate.filter(m => m.type === 'deposit').reduce((sum, m) => sum + Number(m.amount), 0);
    const withdrawals = movementsToCalculate.filter(m => m.type === 'withdrawal').reduce((sum, m) => sum + Number(m.amount), 0);
    const expenses = movementsToCalculate.filter(m => m.type === 'expense').reduce((sum, m) => sum + Number(m.amount), 0);
    const opening = currentRegister ? Number(currentRegister.opening_amount) : 0;
    const cashInRegister = opening + deposits - withdrawals - expenses + 
      movementsToCalculate.filter(m => m.type === 'sale' && m.payment_method === 'cash').reduce((sum, m) => sum + Number(m.amount), 0);

    return { sales, deposits, withdrawals, expenses, cashInRegister };
  };

  // Calcular totais por forma de pagamento para o fechamento
  const calculatePaymentMethodTotals = () => {
    // Always use filteredMovements to respect date filter
    const movementsToCalculate = filteredMovements;
    const salesMovements = movementsToCalculate.filter(m => m.type === 'sale');
    
    const byPaymentMethod = {
      cash: salesMovements.filter(m => m.payment_method === 'cash').reduce((sum, m) => sum + Number(m.amount), 0),
      credit: salesMovements.filter(m => m.payment_method === 'credit').reduce((sum, m) => sum + Number(m.amount), 0),
      debit: salesMovements.filter(m => m.payment_method === 'debit').reduce((sum, m) => sum + Number(m.amount), 0),
      pix: salesMovements.filter(m => m.payment_method === 'pix').reduce((sum, m) => sum + Number(m.amount), 0),
    };

    const countByPaymentMethod = {
      cash: salesMovements.filter(m => m.payment_method === 'cash').length,
      credit: salesMovements.filter(m => m.payment_method === 'credit').length,
      debit: salesMovements.filter(m => m.payment_method === 'debit').length,
      pix: salesMovements.filter(m => m.payment_method === 'pix').length,
    };

    return { byPaymentMethod, countByPaymentMethod, totalSales: salesMovements.length };
  };

  const paymentTotals = calculatePaymentMethodTotals();

  // Calculate total fees based on payment methods configuration
  const calculateTotalFees = () => {
    const paymentTypes = ['cash', 'credit', 'debit', 'pix'];
    let fees = 0;

    paymentTypes.forEach(type => {
      const config = paymentMethodsConfig.find(pm => pm.type === type);
      const amount = paymentTotals.byPaymentMethod[type as keyof typeof paymentTotals.byPaymentMethod] || 0;
      const count = paymentTotals.countByPaymentMethod[type as keyof typeof paymentTotals.countByPaymentMethod] || 0;
      
      if (config && amount > 0) {
        // Percentage fee
        if (config.fee_percentage > 0) {
          fees += amount * (config.fee_percentage / 100);
        }
        // Fixed fee per transaction
        if (config.fee_fixed > 0) {
          fees += count * config.fee_fixed;
        }
      }
    });

    return fees;
  };

  const totalFees = calculateTotalFees();

  const totals = calculateTotals();

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Table order functions
  const openTableOrderDetails = (order: TableOrder) => {
    setSelectedTableOrder(order);
    setShowTableOrderModal(true);
  };

  const openCloseTableModal = (order: TableOrder) => {
    setSelectedTableOrder(order);
    setTablePaymentMethod("cash");
    setTableCashReceived("");
    setShowCloseTableModal(true);
  };

  const calculateTableChange = (): number => {
    if (!selectedTableOrder) return 0;
    const paid = parseFloat(tableCashReceived) || 0;
    return paid - selectedTableOrder.total;
  };

  const tableChange = calculateTableChange();

  const cancelTableOrder = async (order: TableOrder) => {
    if (!confirm(`Tem certeza que deseja cancelar o pedido da Mesa ${order.table_number}? Esta ação não pode ser desfeita.`)) return;

    // Cancel the order
    await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', order.id);

    // Free up the table
    if (order.table_id) {
      await supabase
        .from('tables')
        .update({
          status: 'available',
          current_order_id: null,
          closed_at: new Date().toISOString()
        })
        .eq('id', order.table_id);
    }

    toast({ title: "Pedido cancelado", description: `Mesa ${order.table_number} liberada` });
    fetchData();
  };

  const closeTableOrder = async () => {
    if (!selectedTableOrder || !currentRegister || !user) return;

    // Obter todos os order_ids que fazem parte desta mesa consolidada
    const allOrderIds = (selectedTableOrder as TableOrder & { all_order_ids?: string[] }).all_order_ids || [selectedTableOrder.id];

    // Stock deduction is now handled by the database trigger when status becomes 'delivered'
    // No need for manual stock deduction here

    // Atualizar TODOS os pedidos da mesa com payment_method, status (trigger will handle stock)
    for (const orderId of allOrderIds) {
      await supabase
        .from('orders')
        .update({
          payment_method: tablePaymentMethod,
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', orderId);
    }

    // Criar movimentação de caixa para o total da mesa
    await supabase
      .from('cash_movements')
      .insert({
        cash_register_id: currentRegister.id,
        commerce_id: commerceId,
        type: 'sale',
        amount: selectedTableOrder.total,
        payment_method: tablePaymentMethod,
        description: `Mesa ${selectedTableOrder.table_number} - ${selectedTableOrder.customer_name || 'Cliente'}`,
        created_by: user.id,
        order_id: allOrderIds[0], // Usar o primeiro order_id como referência
      });

    // Liberar a mesa
    if (selectedTableOrder.table_id) {
      await supabase
        .from('tables')
        .update({
          status: 'available',
          current_order_id: null,
          closed_at: new Date().toISOString()
        })
        .eq('id', selectedTableOrder.table_id);
    }

    toast({ title: "Mesa fechada com sucesso!", description: `Pagamento registrado: ${formatCurrency(selectedTableOrder.total)}` });
    setShowCloseTableModal(false);
    setSelectedTableOrder(null);
    fetchData();
  };

  // Close individual participant's bill (for split mode)
  const closeParticipantOrder = async () => {
    if (!selectedParticipant || !selectedTableOrder || !currentRegister || !user) return;

    // Update the participant's orders with payment_method, status
    for (const orderId of selectedParticipant.order_ids) {
      await supabase
        .from('orders')
        .update({
          payment_method: participantPaymentMethod,
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', orderId);
    }

    // Create cash movement for this participant's total
    await supabase
      .from('cash_movements')
      .insert({
        cash_register_id: currentRegister.id,
        commerce_id: commerceId,
        type: 'sale',
        amount: selectedParticipant.total,
        payment_method: participantPaymentMethod,
        description: `Mesa ${selectedTableOrder.table_number} - ${selectedParticipant.participant.customer_name || 'Cliente'}`,
        created_by: user.id,
        order_id: selectedParticipant.order_ids[0],
      });

    // Clear the bill_requested flag for this participant
    await supabase
      .from('table_participants')
      .update({ bill_requested: false, bill_requested_at: null })
      .eq('id', selectedParticipant.participant.id);

    // Check if all participants have been paid (to free the table)
    const remainingOrders = selectedTableOrder.participantOrders?.filter(
      po => po.participant.id !== selectedParticipant.participant.id
    );

    if (!remainingOrders || remainingOrders.length === 0) {
      // All participants paid - close the session and free the table
      if (selectedTableOrder.session) {
        await supabase
          .from('table_sessions')
          .update({ status: 'closed', closed_at: new Date().toISOString() })
          .eq('id', selectedTableOrder.session.id);
      }

      if (selectedTableOrder.table_id) {
        await supabase
          .from('tables')
          .update({
            status: 'available',
            session_id: null,
            current_order_id: null,
            closed_at: new Date().toISOString()
          })
          .eq('id', selectedTableOrder.table_id);
      }
    }

    toast({ 
      title: "Comanda fechada!", 
      description: `Pagamento de ${selectedParticipant.participant.customer_name || 'Cliente'}: ${formatCurrency(selectedParticipant.total)}` 
    });
    setShowCloseParticipantModal(false);
    setSelectedParticipant(null);
    setSelectedTableOrder(null);
    fetchData();
  };

  const openCloseParticipantModal = (order: TableOrder, participantOrder: ParticipantOrder) => {
    setSelectedTableOrder(order);
    setSelectedParticipant(participantOrder);
    setParticipantPaymentMethod("cash");
    setParticipantCashReceived("");
    setShowCloseParticipantModal(true);
  };

  const calculateParticipantChange = (): number => {
    if (!selectedParticipant) return 0;
    const paid = parseFloat(participantCashReceived) || 0;
    return paid - selectedParticipant.total;
  };

  const participantChange = calculateParticipantChange();

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Aguardando',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      delivered: 'Pronto',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
      confirmed: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
      preparing: 'bg-orange-500/20 text-orange-700 border-orange-500/30',
      delivered: 'bg-green-500/20 text-green-700 border-green-500/30',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
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
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Fechar Caixa</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={closeCashRegister} className="space-y-4">
                    {/* Resumo por Forma de Pagamento */}
                    <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Resumo de Vendas por Forma de Pagamento
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center justify-between p-2 rounded bg-background">
                          <div className="flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-green-600" />
                            <span>Dinheiro</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(paymentTotals.byPaymentMethod.cash)}</p>
                            <p className="text-xs text-muted-foreground">{paymentTotals.countByPaymentMethod.cash} vendas</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-background">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            <span>Crédito</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(paymentTotals.byPaymentMethod.credit)}</p>
                            <p className="text-xs text-muted-foreground">{paymentTotals.countByPaymentMethod.credit} vendas</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-background">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-purple-600" />
                            <span>Débito</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(paymentTotals.byPaymentMethod.debit)}</p>
                            <p className="text-xs text-muted-foreground">{paymentTotals.countByPaymentMethod.debit} vendas</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-background">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-teal-600" />
                            <span>PIX</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(paymentTotals.byPaymentMethod.pix)}</p>
                            <p className="text-xs text-muted-foreground">{paymentTotals.countByPaymentMethod.pix} vendas</p>
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 border-t flex justify-between items-center">
                        <span className="font-semibold">Total de Vendas</span>
                        <div className="text-right">
                          <p className="font-bold text-lg text-primary">{formatCurrency(totals.sales)}</p>
                          <p className="text-xs text-muted-foreground">{paymentTotals.totalSales} vendas</p>
                        </div>
                      </div>
                    </div>

                    {/* Conferência por Forma de Pagamento */}
                    <div className="p-4 rounded-lg border space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Conferência Manual (opcional)
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Preencha os valores contabilizados manualmente para comparar com o sistema.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            <Banknote className="w-3 h-3 text-green-600" />
                            Dinheiro Contado
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            className="h-8 text-sm"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Sistema: {formatCurrency(paymentTotals.byPaymentMethod.cash)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-blue-600" />
                            Crédito Contado
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            className="h-8 text-sm"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Sistema: {formatCurrency(paymentTotals.byPaymentMethod.credit)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-purple-600" />
                            Débito Contado
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            className="h-8 text-sm"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Sistema: {formatCurrency(paymentTotals.byPaymentMethod.debit)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            <Smartphone className="w-3 h-3 text-teal-600" />
                            PIX Contado
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            className="h-8 text-sm"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Sistema: {formatCurrency(paymentTotals.byPaymentMethod.pix)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Valor esperado em caixa (apenas dinheiro) */}
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Banknote className="w-4 h-4 text-green-600" />
                        <p className="text-sm text-muted-foreground">Valor esperado em Dinheiro (para conferência)</p>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.cashInRegister)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Abertura ({formatCurrency(currentRegister?.opening_amount || 0)}) + Vendas em dinheiro - Sangrias
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="closing_amount">Valor Final em Dinheiro no Caixa (R$)</Label>
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <ArrowUpCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground">Vendas</p>
                      <HelpTooltip content="Total de vendas realizadas no período" />
                    </div>
                    <p className="text-lg font-bold">{formatCurrency(totals.sales)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Plus className="w-8 h-8 text-blue-500" />
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground">Entradas</p>
                      <HelpTooltip content="Depósitos e entradas manuais de dinheiro" />
                    </div>
                    <p className="text-lg font-bold">{formatCurrency(totals.deposits)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Minus className="w-8 h-8 text-orange-500" />
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground">Sangrias</p>
                      <HelpTooltip content="Retiradas de dinheiro do caixa" />
                    </div>
                    <p className="text-lg font-bold">{formatCurrency(totals.withdrawals)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Percent className="w-8 h-8 text-red-500" />
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground">Taxas</p>
                      <HelpTooltip content="Total de taxas cobradas pelas operadoras de cartão e PIX" />
                    </div>
                    <p className="text-lg font-bold text-red-500">{formatCurrency(totalFees)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-primary" />
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-muted-foreground">Em Caixa</p>
                      <HelpTooltip content="Valor esperado em dinheiro no caixa (abertura + vendas em dinheiro - sangrias)" />
                    </div>
                    <p className="text-lg font-bold text-primary">{formatCurrency(totals.cashInRegister)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Open Tables Section - Below cards, above movements */}
          {tableOrders.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Mesas Abertas</h2>
                <Badge variant="secondary" className="ml-2">{tableOrders.length}</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tableOrders.map((order) => {
                  const isSplitBill = order.session?.bill_mode === 'split';
                  const hasBillRequests = order.hasBillRequests;
                  
                  return (
                    <Card 
                      key={order.id} 
                      className={`${hasBillRequests ? 'border-destructive ring-2 ring-destructive/30 animate-pulse' : 'border-primary/20'}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasBillRequests ? 'bg-destructive/20' : 'bg-primary/10'}`}>
                              {hasBillRequests ? (
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                              ) : (
                                <UtensilsCrossed className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                Mesa {order.table_number}
                                {hasBillRequests && (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                    CONTA!
                                  </Badge>
                                )}
                              </CardTitle>
                              {order.table_name && (
                                <p className="text-xs text-muted-foreground">{order.table_name}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusLabel(order.status)}
                            </Badge>
                            {isSplitBill && (
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                Separada
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Time */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>Aberta em {format(new Date(order.created_at), "HH:mm", { locale: ptBR })}</span>
                        </div>

                        {/* Split Bill - Show participants separately */}
                        {isSplitBill && order.participantOrders && order.participantOrders.length > 0 ? (
                          <div className="space-y-3">
                            {order.participantOrders.map((po) => (
                              <div 
                                key={po.participant.id} 
                                className={`p-3 rounded-lg border ${po.participant.bill_requested ? 'border-destructive bg-destructive/5' : 'border-border bg-muted/30'}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium text-sm">
                                      {po.participant.customer_name || 'Cliente'}
                                    </span>
                                    {po.participant.is_host && (
                                      <Badge variant="secondary" className="text-[10px] px-1">Host</Badge>
                                    )}
                                    {po.participant.bill_requested && (
                                      <Badge variant="destructive" className="text-[10px] px-1 animate-pulse">
                                        Pediu Conta!
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="font-bold text-primary">{formatCurrency(po.total)}</span>
                                </div>
                                
                                {/* Participant's items */}
                                <div className="text-xs space-y-0.5 mb-2 max-h-16 overflow-y-auto">
                                  {po.items.slice(0, 2).map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-muted-foreground">
                                      <span className="truncate">{item.quantity}x {item.product_name}</span>
                                      <span>{formatCurrency(item.total_price)}</span>
                                    </div>
                                  ))}
                                  {po.items.length > 2 && (
                                    <p className="text-muted-foreground/70 italic">+{po.items.length - 2} itens</p>
                                  )}
                                </div>
                                
                                {/* Close this participant's bill */}
                                <Button 
                                  size="sm" 
                                  className="w-full h-7 text-xs"
                                  onClick={() => openCloseParticipantModal(order, po)}
                                  disabled={order.status !== 'delivered'}
                                >
                                  <Receipt className="w-3 h-3 mr-1" />
                                  Fechar Comanda
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            {/* Single Bill - Original display */}
                            {(order.customer_name || order.customer_phone) && (
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {order.customer_name && (
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    <span>{order.customer_name}</span>
                                  </div>
                                )}
                                {order.customer_phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    <span>{order.customer_phone}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Items Preview */}
                            <div className="text-sm space-y-1 max-h-20 overflow-y-auto">
                              {order.items.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="flex justify-between text-muted-foreground">
                                  <span className="truncate">{item.quantity}x {item.product_name}</span>
                                  <span className="flex-shrink-0">{formatCurrency(item.total_price)}</span>
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <p className="text-xs text-muted-foreground italic">
                                  +{order.items.length - 3} itens...
                                </p>
                              )}
                            </div>
                          </>
                        )}

                        {/* Total */}
                        <div className="border-t pt-2 flex justify-between items-center">
                          <span className="text-sm font-medium">Total Mesa</span>
                          <span className="text-lg font-bold text-primary">{formatCurrency(order.total)}</span>
                        </div>

                        {/* Actions - for single bill only */}
                        {!isSplitBill && (
                          <div className="grid grid-cols-2 gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openTableOrderDetails(order)}
                            >
                              Ver Detalhes
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => openCloseTableModal(order)}
                              disabled={order.status !== 'delivered'}
                            >
                              Fechar Mesa
                            </Button>
                          </div>
                        )}
                        
                        {/* For split bills - view details and unify option */}
                        {isSplitBill && (
                          <div className="grid grid-cols-2 gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openTableOrderDetails(order)}
                            >
                              Ver Detalhes
                            </Button>
                            <Button 
                              variant="secondary"
                              size="sm"
                              onClick={() => openCloseTableModal(order)}
                              disabled={order.status !== 'delivered'}
                            >
                              Unificar Contas
                            </Button>
                          </div>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => cancelTableOrder(order)}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancelar Mesa
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

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
                                className="text-destructive hover:text-destructive"
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

      {/* Table Order Details Modal */}
      <Dialog open={showTableOrderModal} onOpenChange={setShowTableOrderModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
              Comanda - Mesa {selectedTableOrder?.table_number}
            </DialogTitle>
          </DialogHeader>
          {selectedTableOrder && (
            <div className="space-y-4">
              {/* Customer Info */}
              {(selectedTableOrder.customer_name || selectedTableOrder.customer_phone) && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                  {selectedTableOrder.customer_name && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{selectedTableOrder.customer_name}</span>
                    </div>
                  )}
                  {selectedTableOrder.customer_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedTableOrder.customer_phone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Status */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={getStatusColor(selectedTableOrder.status)}>
                  {getStatusLabel(selectedTableOrder.status)}
                </Badge>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <h4 className="font-medium">Itens do Pedido</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedTableOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity}x {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <span className="font-bold">{formatCurrency(item.total_price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-bold text-lg">Total</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(selectedTableOrder.total)}</span>
              </div>

              {/* Time */}
              <div className="text-sm text-muted-foreground text-center">
                Pedido aberto em {format(new Date(selectedTableOrder.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTableOrderModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Table Modal */}
      <Dialog open={showCloseTableModal} onOpenChange={setShowCloseTableModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fechar Mesa {selectedTableOrder?.table_number}</DialogTitle>
          </DialogHeader>
          {selectedTableOrder && (
            <div className="space-y-4">
              {/* Order Summary */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="font-medium">{selectedTableOrder.customer_name || 'Não informado'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Itens</span>
                  <span>{selectedTableOrder.items.reduce((acc, item) => acc + item.quantity, 0)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(selectedTableOrder.total)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <Label className="mb-2 block">Forma de Pagamento</Label>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map((method) => {
                    const IconComponent = method.icon;
                    return (
                      <Button
                        key={method.value}
                        variant={tablePaymentMethod === method.value ? "default" : "outline"}
                        className="h-16 flex flex-col gap-1"
                        onClick={() => setTablePaymentMethod(method.value)}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="text-xs">{method.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Change Calculator */}
              {tablePaymentMethod === 'cash' && (
                <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                  <div>
                    <Label>Valor Recebido (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={tableCashReceived}
                      onChange={(e) => setTableCashReceived(e.target.value)}
                      placeholder="Valor recebido do cliente"
                    />
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedTableOrder.total)}</span>
                  </div>
                  {tableCashReceived && (
                    <div className={`p-3 rounded-lg ${tableChange >= 0 ? 'bg-green-500/10 border border-green-500/30' : 'bg-destructive/10 border border-destructive/30'}`}>
                      <p className="text-sm text-muted-foreground">Troco a devolver</p>
                      <p className={`text-2xl font-bold ${tableChange >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {formatCurrency(tableChange)}
                      </p>
                      {tableChange < 0 && (
                        <p className="text-xs text-destructive mt-1">Valor insuficiente!</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCloseTableModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={closeTableOrder}
              disabled={tablePaymentMethod === 'cash' && tableCashReceived && tableChange < 0}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Individual Participant Modal (for split bills) */}
      <Dialog open={showCloseParticipantModal} onOpenChange={setShowCloseParticipantModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Fechar Comanda Individual</DialogTitle>
          </DialogHeader>
          {selectedParticipant && selectedTableOrder && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{selectedParticipant.participant.customer_name || 'Cliente'}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Mesa {selectedTableOrder.table_number}
                </div>
                <div className="mt-2 text-2xl font-bold text-primary">
                  {formatCurrency(selectedParticipant.total)}
                </div>
              </div>

              <div>
                <Label>Forma de Pagamento</Label>
                <Select value={participantPaymentMethod} onValueChange={setParticipantPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {participantPaymentMethod === 'cash' && (
                <div>
                  <Label>Valor Recebido (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={participantCashReceived}
                    onChange={(e) => setParticipantCashReceived(e.target.value)}
                    placeholder={selectedParticipant.total.toFixed(2)}
                  />
                  {participantChange > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      Troco: {formatCurrency(participantChange)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseParticipantModal(false)}>
              Cancelar
            </Button>
            <Button onClick={closeParticipantOrder}>
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommerceCashRegister;
