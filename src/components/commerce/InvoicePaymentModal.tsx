import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  QrCode, 
  Copy, 
  Check, 
  TrendingUp, 
  ShoppingCart, 
  Package,
  BarChart3,
  Wallet,
  MessageCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InvoicePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: string;
    amount: number;
    reference_month: string;
    due_date: string;
  } | null;
  commerceStats?: {
    totalOrders: number;
    totalRevenue: number;
    avgTicket: number;
    totalProducts: number;
  };
}

interface BillingConfig {
  pix_key: string;
  pix_key_type: string;
  qr_code_url: string | null;
  bank_name: string | null;
  account_holder: string;
  cnpj: string | null;
}

const InvoicePaymentModal = ({ isOpen, onClose, invoice, commerceStats }: InvoicePaymentModalProps) => {
  const [copied, setCopied] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [billingConfig, setBillingConfig] = useState<BillingConfig | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchBillingConfig();
    }
  }, [isOpen]);

  const fetchBillingConfig = async () => {
    const { data } = await supabase
      .from('billing_config')
      .select('*')
      .limit(1)
      .single();
    
    if (data) {
      setBillingConfig(data);
    }
  };

  if (!invoice) return null;

  const handleCopyPix = () => {
    if (!billingConfig) return;
    navigator.clipboard.writeText(billingConfig.pix_key);
    setCopied(true);
    toast({ title: "Chave PIX copiada!" });
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePaymentConfirmation = async () => {
    // Update invoice to mark payment as confirmed by commerce
    const { error } = await supabase
      .from('invoices')
      .update({ 
        payment_confirmed_by_commerce: true,
        payment_confirmed_at: new Date().toISOString()
      })
      .eq('id', invoice.id);

    if (error) {
      toast({ 
        variant: 'destructive',
        title: "Erro ao informar pagamento", 
        description: error.message 
      });
      return;
    }

    setPaymentConfirmed(true);
    toast({ 
      title: "Pagamento informado!", 
      description: "Vamos confirmar seu pagamento e atualizar o status da fatura." 
    });
    setTimeout(() => {
      onClose();
      setPaymentConfirmed(false);
    }, 2000);
  };

  const stats = commerceStats || {
    totalOrders: 0,
    totalRevenue: 0,
    avgTicket: 0,
    totalProducts: 0,
  };

  const pixKeyType = billingConfig?.pix_key_type?.toUpperCase() || 'CNPJ';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Pagamento da Fatura - {invoice.reference_month}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo do mês */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Seu desempenho com a Mobdega
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-2 text-green-500 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs">Faturamento</span>
                  </div>
                  <p className="font-bold">R$ {stats.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-2 text-blue-500 mb-1">
                    <ShoppingCart className="w-4 h-4" />
                    <span className="text-xs">Pedidos</span>
                  </div>
                  <p className="font-bold">{stats.totalOrders}</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-2 text-purple-500 mb-1">
                    <Wallet className="w-4 h-4" />
                    <span className="text-xs">Ticket Médio</span>
                  </div>
                  <p className="font-bold">R$ {stats.avgTicket.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-2 text-orange-500 mb-1">
                    <Package className="w-4 h-4" />
                    <span className="text-xs">Produtos</span>
                  </div>
                  <p className="font-bold">{stats.totalProducts}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                💡 A Mobdega ajuda você a gerenciar e crescer seu negócio!
              </p>
            </CardContent>
          </Card>

          {/* Valor da fatura */}
          <div className="text-center py-4 border-y">
            <p className="text-sm text-muted-foreground mb-1">Valor a pagar</p>
            <p className="text-4xl font-bold text-primary">
              R$ {Number(invoice.amount).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Vencimento: {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
            </p>
          </div>

          {/* QR Code e Chave PIX */}
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-xl border">
                {billingConfig?.qr_code_url ? (
                  <img 
                    src={billingConfig.qr_code_url} 
                    alt="QR Code PIX" 
                    className="w-32 h-32 object-contain"
                  />
                ) : (
                  <QrCode className="w-32 h-32 text-gray-800" />
                )}
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Escaneie o QR Code ou use a chave PIX abaixo
              </p>
            </div>

            {billingConfig ? (
              <div className="p-4 rounded-lg bg-muted/30 border">
                <p className="text-xs text-muted-foreground mb-1">Chave PIX ({pixKeyType})</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm font-mono">{billingConfig.pix_key}</code>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCopyPix}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Favorecido: {billingConfig.account_holder}
                </p>
                {billingConfig.cnpj && (
                  <p className="text-xs text-muted-foreground">
                    CNPJ: {billingConfig.cnpj}
                  </p>
                )}
                {billingConfig.bank_name && (
                  <p className="text-xs text-muted-foreground">
                    Banco: {billingConfig.bank_name}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-muted/30 border text-center">
                <p className="text-sm text-muted-foreground">
                  Dados de pagamento não configurados. Entre em contato com o suporte.
                </p>
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col gap-2">
            {paymentConfirmed ? (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-medium text-green-500">Pagamento informado!</p>
                <p className="text-xs text-muted-foreground">
                  Estamos verificando seu pagamento...
                </p>
              </div>
            ) : (
              <Button onClick={handlePaymentConfirmation} className="w-full gap-2">
                <Check className="w-4 h-4" />
                Fiz o Pagamento
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => window.open(`https://wa.me/5511949830010?text=Olá! Preciso de ajuda com a fatura ${invoice.reference_month}`, '_blank')}
              className="w-full gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Preciso de Ajuda
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoicePaymentModal;
