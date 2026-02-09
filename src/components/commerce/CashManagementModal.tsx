import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  CheckCircle,
  AlertTriangle,
  Clock,
  Banknote,
  CreditCard,
  Smartphone,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/formatCurrency";

interface CashManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commerceId: string;
}

interface ClosedRegister {
  id: string;
  opening_amount: number;
  closing_amount: number | null;
  expected_amount: number | null;
  difference: number | null;
  opened_at: string;
  closed_at: string | null;
  notes: string | null;
  // Calculated insights
  totalSales: number;
  salesCount: number;
  ticketMedio: number;
  topPaymentMethod: string;
  durationMinutes: number;
  byPaymentMethod: Record<string, number>;
}

const ITEMS_PER_PAGE = 10;

const paymentLabels: Record<string, string> = {
  cash: "Dinheiro",
  credit: "Crédito",
  debit: "Débito",
  pix: "PIX",
};

const CashManagementModal = ({ open, onOpenChange, commerceId }: CashManagementModalProps) => {
  const [registers, setRegisters] = useState<ClosedRegister[]>([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchClosedRegisters = async () => {
    setLoading(true);
    const from = page * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data: regs, count } = await supabase
      .from("cash_registers")
      .select("*", { count: "exact" })
      .eq("commerce_id", commerceId)
      .eq("status", "closed")
      .order("closed_at", { ascending: false })
      .range(from, to);

    setTotalCount(count ?? 0);

    if (!regs || regs.length === 0) {
      setRegisters([]);
      setLoading(false);
      return;
    }

    // Fetch movements for all these registers in one query
    const regIds = regs.map((r) => r.id);
    const { data: allMovements } = await supabase
      .from("cash_movements")
      .select("cash_register_id, type, amount, payment_method")
      .in("cash_register_id", regIds);

    const movementsByReg = new Map<string, typeof allMovements>();
    (allMovements || []).forEach((m) => {
      const list = movementsByReg.get(m.cash_register_id) || [];
      list.push(m);
      movementsByReg.set(m.cash_register_id, list);
    });

    const enriched: ClosedRegister[] = regs.map((reg) => {
      const moves = movementsByReg.get(reg.id) || [];
      const sales = moves.filter((m) => m.type === "sale");
      const totalSales = sales.reduce((s, m) => s + Number(m.amount), 0);
      const salesCount = sales.length;
      const ticketMedio = salesCount > 0 ? totalSales / salesCount : 0;

      const byPM: Record<string, number> = {};
      sales.forEach((m) => {
        byPM[m.payment_method] = (byPM[m.payment_method] || 0) + Number(m.amount);
      });

      const topPaymentMethod =
        Object.entries(byPM).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

      const durationMinutes =
        reg.opened_at && reg.closed_at
          ? differenceInMinutes(new Date(reg.closed_at), new Date(reg.opened_at))
          : 0;

      return {
        id: reg.id,
        opening_amount: Number(reg.opening_amount),
        closing_amount: reg.closing_amount != null ? Number(reg.closing_amount) : null,
        expected_amount: reg.expected_amount != null ? Number(reg.expected_amount) : null,
        difference: reg.difference != null ? Number(reg.difference) : null,
        opened_at: reg.opened_at,
        closed_at: reg.closed_at,
        notes: reg.notes,
        totalSales,
        salesCount,
        ticketMedio,
        topPaymentMethod,
        durationMinutes,
        byPaymentMethod: byPM,
      };
    });

    setRegisters(enriched);
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      setPage(0);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      fetchClosedRegisters();
    }
  }, [open, page, commerceId]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}min`;
    return `${h}h ${m}min`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Gestão de Caixa
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
          </div>
        ) : registers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum caixa fechado encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {registers.map((reg) => {
              const isReconciled = reg.difference !== null && Math.abs(reg.difference) < 0.01;
              return (
                <Card key={reg.id} className={`border ${isReconciled ? "border-green-500/30" : "border-red-500/30"}`}>
                  <CardContent className="p-4 space-y-3">
                    {/* Header: dates + status */}
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {format(new Date(reg.opened_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                            {" → "}
                            {reg.closed_at
                              ? format(new Date(reg.closed_at), "dd/MM/yy HH:mm", { locale: ptBR })
                              : "-"}
                          </span>
                        </div>
                      </div>
                      <Badge variant={isReconciled ? "success" : "destructive"} className="flex items-center gap-1">
                        {isReconciled ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> 100% Conferido
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3" /> Divergência
                          </>
                        )}
                      </Badge>
                    </div>

                    {/* Values grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-xs text-muted-foreground">Abertura</p>
                        <p className="font-bold">{formatCurrency(reg.opening_amount)}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-xs text-muted-foreground">Fechamento</p>
                        <p className="font-bold">{formatCurrency(reg.closing_amount ?? 0)}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-xs text-muted-foreground">Esperado</p>
                        <p className="font-bold">{formatCurrency(reg.expected_amount ?? 0)}</p>
                      </div>
                      <div className={`p-2 rounded ${isReconciled ? "bg-green-500/10" : "bg-red-500/10"}`}>
                        <p className="text-xs text-muted-foreground">Diferença</p>
                        <p className={`font-bold ${isReconciled ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(reg.difference ?? 0)}
                        </p>
                      </div>
                    </div>

                    {/* Payment method breakdown */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {Object.entries(reg.byPaymentMethod).map(([method, amount]) => {
                        const Icon =
                          method === "cash" ? Banknote
                          : method === "pix" ? Smartphone
                          : CreditCard;
                        return (
                          <div key={method} className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted">
                            <Icon className="w-3 h-3" />
                            <span>{paymentLabels[method] || method}:</span>
                            <span className="font-bold">{formatCurrency(amount)}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Insights */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border-t pt-3">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-primary" />
                        <div>
                          <p className="text-muted-foreground">Total Vendas</p>
                          <p className="font-bold">{formatCurrency(reg.totalSales)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Ticket Médio</p>
                        <p className="font-bold">{formatCurrency(reg.ticketMedio)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Mais Usada</p>
                        <p className="font-bold">{paymentLabels[reg.topPaymentMethod] || reg.topPaymentMethod}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Duração</p>
                        <p className="font-bold">{formatDuration(reg.durationMinutes)}</p>
                      </div>
                    </div>

                    {reg.notes && (
                      <p className="text-xs text-muted-foreground italic border-t pt-2">
                        Obs: {reg.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CashManagementModal;
