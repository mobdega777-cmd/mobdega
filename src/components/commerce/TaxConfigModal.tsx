import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  Info, 
  Loader2,
  Receipt,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TaxConfig {
  tax_type: 'fixed' | 'percentage';
  tax_value: number;
  tax_regime: 'mei' | 'simples' | 'lucro_presumido' | 'lucro_real';
  tax_payment_day: number;
}

interface TaxConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  commerceId: string;
  currentConfig: TaxConfig | null;
  onSave: (config: TaxConfig) => void;
}

const TaxConfigModal = ({ isOpen, onClose, commerceId, currentConfig, onSave }: TaxConfigModalProps) => {
  const [taxType, setTaxType] = useState<'fixed' | 'percentage'>('percentage');
  const [taxValue, setTaxValue] = useState("");
  const [taxRegime, setTaxRegime] = useState<'mei' | 'simples' | 'lucro_presumido' | 'lucro_real'>('simples');
  const [taxPaymentDay, setTaxPaymentDay] = useState("20");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (currentConfig) {
      setTaxType(currentConfig.tax_type);
      setTaxValue(currentConfig.tax_value.toString());
      setTaxRegime(currentConfig.tax_regime);
      setTaxPaymentDay(currentConfig.tax_payment_day.toString());
    }
  }, [currentConfig]);

  const handleSave = () => {
    const value = parseFloat(taxValue) || 0;
    if (value < 0) {
      toast({ variant: "destructive", title: "Valor inválido" });
      return;
    }

    setSaving(true);
    
    const config: TaxConfig = {
      tax_type: taxType,
      tax_value: value,
      tax_regime: taxRegime,
      tax_payment_day: parseInt(taxPaymentDay) || 20,
    };
    
    onSave(config);
    setSaving(false);
    onClose();
  };

  const regimeInfo = {
    mei: {
      name: "MEI",
      description: "Microempreendedor Individual",
      taxRange: "Fixo: R$ 82,05 a R$ 87,05/mês",
      paymentDeadline: "Dia 20 de cada mês",
    },
    simples: {
      name: "Simples Nacional",
      description: "Microempresa ou EPP",
      taxRange: "4% a 33% do faturamento",
      paymentDeadline: "Dia 20 de cada mês",
    },
    lucro_presumido: {
      name: "Lucro Presumido",
      description: "Presunção de margem de lucro",
      taxRange: "~11,33% a 16,33%",
      paymentDeadline: "Trimestral ou mensal",
    },
    lucro_real: {
      name: "Lucro Real",
      description: "Apuração sobre lucro efetivo",
      taxRange: "Variável conforme lucro",
      paymentDeadline: "Trimestral ou mensal",
    },
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Configuração de Impostos
          </DialogTitle>
          <DialogDescription>
            Configure como deseja calcular os impostos para o seu negócio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Regime Selection */}
          <div className="space-y-3">
            <Label className="font-semibold">Regime Tributário</Label>
            <Select value={taxRegime} onValueChange={(v) => setTaxRegime(v as typeof taxRegime)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o regime" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mei">MEI - Microempreendedor Individual</SelectItem>
                <SelectItem value="simples">Simples Nacional</SelectItem>
                <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                <SelectItem value="lucro_real">Lucro Real</SelectItem>
              </SelectContent>
            </Select>

            <Card className="bg-muted/50">
              <CardContent className="p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">{regimeInfo[taxRegime].name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{regimeInfo[taxRegime].description}</p>
                <div className="flex gap-4 text-xs mt-2">
                  <Badge variant="outline" className="gap-1">
                    <Calculator className="w-3 h-3" />
                    {regimeInfo[taxRegime].taxRange}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="w-3 h-3" />
                    {regimeInfo[taxRegime].paymentDeadline}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tax Type */}
          <div className="space-y-3">
            <Label className="font-semibold">Tipo de Cálculo</Label>
            <RadioGroup value={taxType} onValueChange={(v) => setTaxType(v as 'fixed' | 'percentage')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed" className="font-normal cursor-pointer">
                  Valor Fixo Mensal (R$)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="font-normal cursor-pointer">
                  Percentual do Faturamento (%)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Tax Value */}
          <div className="space-y-2">
            <Label className="font-semibold">
              {taxType === 'fixed' ? 'Valor Fixo (R$)' : 'Percentual (%)'}
            </Label>
            <Input
              type="number"
              step={taxType === 'fixed' ? '0.01' : '0.1'}
              min="0"
              max={taxType === 'percentage' ? '100' : undefined}
              placeholder={taxType === 'fixed' ? 'Ex: 71.60' : 'Ex: 6'}
              value={taxValue}
              onChange={(e) => setTaxValue(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {taxType === 'fixed' 
                ? 'Valor mensal fixo que será descontado do lucro'
                : 'Percentual sobre o faturamento que será calculado como imposto'
              }
            </p>
          </div>

          {/* Payment Day */}
          <div className="space-y-2">
            <Label className="font-semibold">Dia de Vencimento</Label>
            <Select value={taxPaymentDay} onValueChange={setTaxPaymentDay}>
              <SelectTrigger>
                <SelectValue placeholder="Dia do mês" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    Dia {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Data mensal para pagamento do imposto (DAS para MEI/Simples)
            </p>
          </div>

          {/* Tips */}
          <Card className="bg-accent/30 border-accent/50">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                <Info className="w-4 h-4" />
                Dicas Importantes
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 text-xs space-y-1 text-muted-foreground">
              <p>• <strong>MEI:</strong> Limite de R$ 81.000/ano. DAS fixo vence dia 20.</p>
              <p>• <strong>Simples Nacional:</strong> Alíquota varia de 4% a 33% conforme faixa de faturamento.</p>
              <p>• Consulte seu contador para valores exatos.</p>
              <p>• Os valores configurados aqui são para controle interno e relatórios.</p>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar Configuração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaxConfigModal;
