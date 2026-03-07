import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, Copy, Check, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatCurrency";
import { useToast } from "@/hooks/use-toast";

interface RegistrationPaymentModalProps {
  isOpen: boolean;
  planName: string;
  planPrice: number;
  couponDiscount: { type: string; value: number } | null;
  onConfirmPayment: () => void;
}

interface BillingData {
  pix_key: string;
  pix_key_type: string;
  qr_code_url: string | null;
  bank_name: string | null;
  account_holder: string;
  cnpj: string | null;
}

const pixKeyTypeLabels: Record<string, string> = {
  cnpj: "CNPJ",
  cpf: "CPF",
  email: "E-mail",
  phone: "Telefone",
  random: "Chave Aleatória",
};

const RegistrationPaymentModal = ({
  isOpen,
  planName,
  planPrice,
  couponDiscount,
  onConfirmPayment,
}: RegistrationPaymentModalProps) => {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { toast } = useToast();

  const finalPrice = (() => {
    if (!couponDiscount) return planPrice;
    if (couponDiscount.type === "percentage") {
      return planPrice * (1 - couponDiscount.value / 100);
    }
    return Math.max(0, planPrice - couponDiscount.value);
  })();

  useEffect(() => {
    if (!isOpen) return;
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_billing_config_public");
      if (!error && data && (data as any[]).length > 0) {
        setBilling((data as any[])[0]);
      }
      setLoading(false);
    };
    fetch();
  }, [isOpen]);

  const handleCopyKey = async () => {
    if (!billing) return;
    await navigator.clipboard.writeText(billing.pix_key);
    setCopied(true);
    toast({ title: "Chave PIX copiada!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = async () => {
    setConfirming(true);
    // Small delay for UX
    await new Promise((r) => setTimeout(r, 500));
    onConfirmPayment();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-card rounded-2xl shadow-elevated w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Pagamento do Plano
              </h2>
            </div>

            <div className="p-6 space-y-5">
              {/* Plan info */}
              <div className="rounded-xl bg-primary/10 p-4 space-y-1">
                <p className="text-sm text-muted-foreground">Plano selecionado</p>
                <p className="font-bold text-lg text-foreground">{planName}</p>
                <div className="flex items-baseline gap-2">
                  {couponDiscount && (
                    <span className="text-sm line-through text-muted-foreground">
                      {formatCurrency(planPrice)}
                    </span>
                  )}
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(finalPrice)}
                  </span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
                {couponDiscount && (
                  <p className="text-xs text-green-600 font-medium">
                    Desconto de cupom aplicado!
                  </p>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : !billing ? (
                <p className="text-center text-muted-foreground text-sm py-4">
                  Dados de pagamento não configurados. Entre em contato com o suporte.
                </p>
              ) : (
                <>
                  {/* QR Code */}
                  {billing.qr_code_url && (
                    <div className="flex justify-center">
                      <div className="p-3 bg-white rounded-xl border border-border">
                        <img
                          src={billing.qr_code_url}
                          alt="QR Code PIX"
                          className="w-48 h-48 object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* PIX Key */}
                  <div className="space-y-3">
                    <div className="rounded-lg bg-muted p-4 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Chave PIX ({pixKeyTypeLabels[billing.pix_key_type] || billing.pix_key_type})
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono flex-1 break-all text-foreground">
                          {billing.pix_key}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyKey}
                          className="shrink-0"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Holder info */}
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Favorecido:</strong>{" "}
                        {billing.account_holder}
                      </p>
                      {billing.cnpj && (
                        <p>
                          <strong className="text-foreground">CNPJ:</strong>{" "}
                          {billing.cnpj}
                        </p>
                      )}
                      {billing.bank_name && (
                        <p>
                          <strong className="text-foreground">Banco:</strong>{" "}
                          {billing.bank_name}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Confirm button */}
              <Button
                variant="hero"
                className="w-full"
                size="lg"
                onClick={handleConfirm}
                disabled={confirming || loading || !billing}
              >
                {confirming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Já realizei o pagamento"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Após confirmar, seu comércio ficará aguardando aprovação do administrador.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RegistrationPaymentModal;
