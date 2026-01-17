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
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Receipt
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CommerceFinancialProps {
  commerceId: string;
}

interface Invoice {
  id: string;
  type: string;
  amount: number;
  status: string;
  reference_month: string;
  due_date: string;
  paid_at: string | null;
  notes: string | null;
}

const CommerceFinancial = ({ commerceId }: CommerceFinancialProps) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    monthlyRevenue: 0,
    pendingPayments: 0,
    overduePayments: 0,
  });
  const { toast } = useToast();

  const fetchData = async () => {
    // Fetch orders for revenue
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    
    const { data: orders } = await supabase
      .from('orders')
      .select('total, status')
      .eq('commerce_id', commerceId)
      .eq('status', 'delivered')
      .gte('created_at', firstDayOfMonth);

    const monthlyRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;

    // Fetch invoices
    const { data: invoicesData } = await supabase
      .from('invoices')
      .select('*')
      .eq('commerce_id', commerceId)
      .order('due_date', { ascending: false });

    const pendingPayments = invoicesData?.filter(i => 
      i.type === 'payable' && i.status === 'pending'
    ).reduce((sum, i) => sum + Number(i.amount), 0) || 0;

    const overduePayments = invoicesData?.filter(i => 
      i.status === 'overdue'
    ).reduce((sum, i) => sum + Number(i.amount), 0) || 0;

    setStats({
      monthlyRevenue,
      pendingPayments,
      overduePayments,
    });
    setInvoices(invoicesData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [commerceId]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-500" },
      paid: { label: "Pago", color: "bg-green-500/20 text-green-500" },
      overdue: { label: "Vencido", color: "bg-red-500/20 text-red-500" },
      cancelled: { label: "Cancelado", color: "bg-gray-500/20 text-gray-500" },
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground">Acompanhe as finanças do seu comércio</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Faturamento do Mês</p>
                <p className="text-2xl font-bold text-green-500">
                  R$ {stats.monthlyRevenue.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">A Pagar (Pendente)</p>
                <p className="text-2xl font-bold text-yellow-500">
                  R$ {stats.pendingPayments.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-500/10">
                <ArrowDownCircle className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vencidos</p>
                <p className="text-2xl font-bold text-red-500">
                  R$ {stats.overduePayments.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/10">
                <TrendingDown className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Faturas e Cobranças
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma fatura encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const status = getStatusBadge(invoice.status);
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {invoice.type === 'receivable' ? (
                            <ArrowUpCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <ArrowDownCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span>
                            {invoice.type === 'receivable' ? 'A Receber' : 'A Pagar'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{invoice.reference_month}</TableCell>
                      <TableCell className="font-medium">
                        R$ {Number(invoice.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommerceFinancial;
