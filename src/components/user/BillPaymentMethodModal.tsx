import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CreditCard, Banknote, Smartphone, Loader2 } from "lucide-react";

interface BillPaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (paymentMethod: string, changeFor?: number) => Promise<void>;
  loading?: boolean;
}

const paymentOptions = [
  { value: 'credit', label: 'Cartão de Crédito', icon: CreditCard },
  { value: 'debit', label: 'Cartão de Débito', icon: CreditCard },
  { value: 'pix', label: 'PIX', icon: Smartphone },
  { value: 'cash', label: 'Dinheiro', icon: Banknote },
];

const BillPaymentMethodModal = ({ 
  open, 
  onOpenChange, 
  onConfirm,
  loading = false 
}: BillPaymentMethodModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('pix');
  const [changeFor, setChangeFor] = useState<string>('');

  const handleConfirm = async () => {
    const changeValue = selectedMethod === 'cash' && changeFor ? parseFloat(changeFor) : undefined;
    await onConfirm(selectedMethod, changeValue);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setChangeFor('');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Como deseja pagar?</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <RadioGroup
            value={selectedMethod}
            onValueChange={(value) => {
              setSelectedMethod(value);
              if (value !== 'cash') {
                setChangeFor('');
              }
            }}
            className="space-y-3"
          >
            {paymentOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.value}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedMethod === option.value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => {
                    setSelectedMethod(option.value);
                    if (option.value !== 'cash') {
                      setChangeFor('');
                    }
                  }}
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <Label 
                    htmlFor={option.value} 
                    className="flex-1 cursor-pointer font-medium"
                  >
                    {option.label}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>

          {/* Campo de troco para pagamento em dinheiro */}
          {selectedMethod === 'cash' && (
            <div className="pt-2 border-t">
              <Label htmlFor="changeFor" className="text-sm text-muted-foreground">
                Precisa de troco? Informe o valor:
              </Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  id="changeFor"
                  type="number"
                  placeholder="Ex: 100,00"
                  value={changeFor}
                  onChange={(e) => setChangeFor(e.target.value)}
                  className="pl-10"
                  min="0"
                  step="0.01"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Deixe em branco se não precisar de troco
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={loading || !selectedMethod}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Solicitando...
              </>
            ) : (
              'Pedir Conta'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BillPaymentMethodModal;
