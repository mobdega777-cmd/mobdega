import { useEffect, useState } from "react";
import { Receipt, Save, Percent, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Config {
  id?: string;
  charge_type: "fixed" | "percent";
  charge_value: number;
  min_invoice_amount: number;
  description: string;
}

const AdminBilling = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<Config>({
    charge_type: "fixed",
    charge_value: 0,
    min_invoice_amount: 0,
    description: "",
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("transaction_billing_config" as any)
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (data) {
      setConfig({
        id: (data as any).id,
        charge_type: (data as any).charge_type,
        charge_value: Number((data as any).charge_value) || 0,
        min_invoice_amount: Number((data as any).min_invoice_amount) || 0,
        description: (data as any).description || "",
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      charge_type: config.charge_type,
      charge_value: config.charge_value,
      min_invoice_amount: config.min_invoice_amount,
      description: config.description,
    };
    const result = config.id
      ? await supabase.from("transaction_billing_config" as any).update(payload).eq("id", config.id)
      : await supabase.from("transaction_billing_config" as any).insert(payload);
    if (result.error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: result.error.message });
    } else {
      toast({ title: "Configuração de cobrança salva!" });
      fetchConfig();
    }
    setSaving(false);
  };

  const previewSale = 100;
  const previewFee =
    config.charge_type === "percent"
      ? (previewSale * config.charge_value) / 100
      : config.charge_value;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Cobrança por Transação</h1>
        <p className="text-muted-foreground mt-1">
          Defina o valor cobrado por cada venda realizada pelas adegas/tabacarias
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Modelo de Cobrança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Tipo de cobrança</Label>
            <RadioGroup
              value={config.charge_type}
              onValueChange={(v: "fixed" | "percent") =>
                setConfig({ ...config, charge_type: v })
              }
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              <label
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer ${
                  config.charge_type === "fixed" ? "border-primary bg-primary/5" : ""
                }`}
              >
                <RadioGroupItem value="fixed" />
                <DollarSign className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Valor fixo por venda</p>
                  <p className="text-xs text-muted-foreground">Ex: R$ 0,50 por venda</p>
                </div>
              </label>
              <label
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer ${
                  config.charge_type === "percent" ? "border-primary bg-primary/5" : ""
                }`}
              >
                <RadioGroupItem value="percent" />
                <Percent className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Percentual sobre o valor</p>
                  <p className="text-xs text-muted-foreground">Ex: 2% sobre cada venda</p>
                </div>
              </label>
            </RadioGroup>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Valor {config.charge_type === "fixed" ? "(R$)" : "(%)"}
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={config.charge_value}
                onChange={(e) =>
                  setConfig({ ...config, charge_value: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Valor mínimo de fatura (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={config.min_invoice_amount}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    min_invoice_amount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição que aparece nas faturas</Label>
            <Textarea
              rows={2}
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              placeholder="Ex: Taxa por transação realizada na plataforma"
            />
          </div>

          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-1">
              <p className="text-sm font-semibold">Pré-visualização</p>
              <p className="text-sm text-muted-foreground">
                Em uma venda de R$ {previewSale.toFixed(2)}, o comércio paga{" "}
                <strong className="text-primary">
                  R$ {previewFee.toFixed(2)}
                </strong>
                {config.charge_type === "percent" && ` (${config.charge_value}%)`}
              </p>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar Cobrança"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBilling;
