import { useState, useEffect } from "react";
import { 
  FileText, 
  Building2, 
  Calendar, 
  CreditCard,
  User,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Loader2,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatCurrency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CommerceContractProps {
  commerceId: string;
}

interface CommerceData {
  fantasy_name: string;
  owner_name: string;
  document: string;
  document_type: string;
  email: string;
  phone: string;
  address: string | null;
  address_number: string | null;
  neighborhood: string | null;
  city: string | null;
  cep: string | null;
  created_at: string;
  approved_at: string | null;
  payment_due_day: number;
  plan: {
    name: string;
    type: string;
    price: number;
  } | null;
  coupon_code: string | null;
}

interface CouponData {
  discount_type: string;
  discount_value: number;
}

const CommerceContract = ({ commerceId }: CommerceContractProps) => {
  const [commerce, setCommerce] = useState<CommerceData | null>(null);
  const [coupon, setCoupon] = useState<CouponData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContractData();
  }, [commerceId]);

  const fetchContractData = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('commerces')
      .select(`
        fantasy_name,
        owner_name,
        document,
        document_type,
        email,
        phone,
        address,
        address_number,
        neighborhood,
        city,
        cep,
        created_at,
        approved_at,
        payment_due_day,
        coupon_code,
        plans (
          name,
          type,
          price
        )
      `)
      .eq('id', commerceId)
      .single();

    if (error) {
      console.error('Error fetching contract data:', error);
    } else if (data) {
      setCommerce({
        ...data,
        plan: data.plans as any,
        payment_due_day: data.payment_due_day || 10
      });

      // Fetch coupon if exists
      if (data.coupon_code) {
        const { data: couponData } = await supabase
          .from('discount_coupons')
          .select('discount_type, discount_value')
          .eq('code', data.coupon_code)
          .maybeSingle();

        if (couponData) {
          setCoupon(couponData);
        }
      }
    }

    setLoading(false);
  };

  const calculateFinalPrice = (): number => {
    if (!commerce?.plan) return 0;
    
    const originalPrice = commerce.plan.price;
    if (!coupon) return originalPrice;

    if (coupon.discount_type === 'percentage') {
      return originalPrice * (1 - coupon.discount_value / 100);
    }
    return Math.max(0, originalPrice - coupon.discount_value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!commerce) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>Dados do contrato não encontrados</p>
      </div>
    );
  }

  const finalPrice = calculateFinalPrice();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Contrato de Prestação de Serviços
          </h2>
          <p className="text-muted-foreground mt-1">
            Termo de adesão à plataforma Mobdega
          </p>
        </div>
      </div>

      {/* Contract Document */}
      <Card className="border-2">
        <CardHeader className="text-center border-b bg-muted/30">
          <div className="space-y-2">
            <h1 className="text-xl font-bold">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
            <p className="text-sm text-muted-foreground">PLATAFORMA MOBDEGA</p>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6 text-sm leading-relaxed">
          {/* Parties */}
          <section>
            <h3 className="font-bold text-base mb-3">1. DAS PARTES</h3>
            
            <div className="space-y-4 pl-4">
              <div>
                <p className="font-semibold">CONTRATANTE (ESTABELECIMENTO):</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span><strong>Razão/Nome:</strong> {commerce.fantasy_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span><strong>Responsável:</strong> {commerce.owner_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span><strong>{commerce.document_type === 'cnpj' ? 'CNPJ' : 'CPF'}:</strong> {commerce.document}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span><strong>E-mail:</strong> {commerce.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span><strong>Telefone:</strong> {commerce.phone}</span>
                  </div>
                  {commerce.address && (
                    <div className="flex items-center gap-2 md:col-span-2">
                      <MapPin className="w-4 h-4" />
                      <span><strong>Endereço:</strong> {commerce.address}, {commerce.address_number} - {commerce.neighborhood}, {commerce.city} - CEP: {commerce.cep}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="font-semibold">CONTRATADA (PLATAFORMA):</p>
                <p className="text-muted-foreground mt-1">
                  <strong>MOBDEGA</strong> - Plataforma digital de gestão para adegas e tabacarias.
                </p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Object */}
          <section>
            <h3 className="font-bold text-base mb-3">2. DO OBJETO</h3>
            <p className="pl-4 text-muted-foreground">
              O presente contrato tem por objeto a prestação de serviços de plataforma digital para gestão comercial, 
              incluindo mas não se limitando a: gestão de pedidos, controle de estoque, cardápio digital, 
              sistema de delivery, controle de mesas/comandas, relatórios financeiros e demais funcionalidades 
              disponibilizadas pelo plano contratado.
            </p>
          </section>

          <Separator />

          {/* Plan */}
          <section>
            <h3 className="font-bold text-base mb-3">3. DO PLANO E VALORES</h3>
            <div className="pl-4 space-y-3">
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Plano Contratado:</span>
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {commerce.plan?.name || 'N/A'}
                  </Badge>
                </div>
                
                {coupon && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Valor Original:</span>
                    <span className="line-through">{formatCurrency(commerce.plan?.price || 0)}/mês</span>
                  </div>
                )}
                
                {coupon && (
                  <div className="flex items-center justify-between text-green-600">
                    <span>Cupom Aplicado ({commerce.coupon_code}):</span>
                    <span>
                      -{coupon.discount_type === 'percentage' 
                        ? `${coupon.discount_value}%` 
                        : formatCurrency(coupon.discount_value)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between font-bold text-lg border-t pt-2">
                  <span>Valor Mensal:</span>
                  <span className="text-primary">{formatCurrency(finalPrice)}/mês</span>
                </div>

                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Dia de Vencimento:
                  </span>
                  <span className="font-semibold">Todo dia {commerce.payment_due_day} de cada mês</span>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Obligations */}
          <section>
            <h3 className="font-bold text-base mb-3">4. DAS OBRIGAÇÕES</h3>
            
            <div className="pl-4 space-y-4">
              <div>
                <p className="font-semibold mb-2">4.1 Obrigações da CONTRATADA (Mobdega):</p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Disponibilizar acesso à plataforma 24 horas por dia, 7 dias por semana, salvo manutenções programadas;</li>
                  <li>Garantir a segurança e confidencialidade dos dados armazenados;</li>
                  <li>Fornecer suporte técnico através dos canais oficiais;</li>
                  <li>Manter as funcionalidades do plano contratado em pleno funcionamento;</li>
                  <li>Comunicar previamente sobre atualizações e manutenções programadas;</li>
                  <li>Disponibilizar material de treinamento e tutoriais para uso da plataforma.</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-2">4.2 Obrigações do CONTRATANTE (Estabelecimento):</p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Efetuar o pagamento da mensalidade até a data de vencimento (dia {commerce.payment_due_day});</li>
                  <li>Fornecer informações verdadeiras e atualizadas;</li>
                  <li>Não utilizar a plataforma para fins ilícitos ou que violem a legislação vigente;</li>
                  <li>Manter a confidencialidade das credenciais de acesso;</li>
                  <li>Comunicar à CONTRATADA qualquer irregularidade ou problema técnico;</li>
                  <li>Zelar pela qualidade das informações e conteúdos cadastrados.</li>
                </ul>
              </div>
            </div>
          </section>

          <Separator />

          {/* Payment */}
          <section>
            <h3 className="font-bold text-base mb-3">5. DO PAGAMENTO</h3>
            <div className="pl-4 space-y-2 text-muted-foreground">
              <p>
                5.1 O pagamento deverá ser efetuado mensalmente, até o dia <strong>{commerce.payment_due_day}</strong> de cada mês, 
                através dos métodos de pagamento disponibilizados pela plataforma (PIX, boleto ou cartão).
              </p>
              <p>
                5.2 O atraso no pagamento acarretará a suspensão temporária do acesso até a regularização.
              </p>
              <p>
                5.3 A inadimplência superior a 30 (trinta) dias poderá resultar no cancelamento do serviço, 
                sem prejuízo da cobrança dos valores devidos.
              </p>
            </div>
          </section>

          <Separator />

          {/* Cancellation */}
          <section>
            <h3 className="font-bold text-base mb-3">6. DO CANCELAMENTO</h3>
            <div className="pl-4 space-y-2 text-muted-foreground">
              <p>
                6.1 <strong>Não há período de carência ou fidelidade.</strong> O CONTRATANTE pode solicitar o 
                cancelamento a qualquer momento, sem multas ou penalidades.
              </p>
              <p>
                6.2 O cancelamento será efetivado ao final do período já pago, mantendo-se o acesso até o término.
              </p>
              <p>
                6.3 A CONTRATADA reserva-se o direito de cancelar o contrato em caso de violação dos termos 
                ou uso indevido da plataforma.
              </p>
            </div>
          </section>

          <Separator />

          {/* General Provisions */}
          <section>
            <h3 className="font-bold text-base mb-3">7. DISPOSIÇÕES GERAIS</h3>
            <div className="pl-4 space-y-2 text-muted-foreground">
              <p>
                7.1 Este contrato é regido pelas leis da República Federativa do Brasil.
              </p>
              <p>
                7.2 Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer questões oriundas deste contrato.
              </p>
              <p>
                7.3 Ao utilizar a plataforma, o CONTRATANTE declara ter lido e aceito integralmente os termos deste contrato.
              </p>
            </div>
          </section>

          <Separator />

          {/* Signatures */}
          <section className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-center">
                <div className="border-t border-foreground/30 pt-2 mt-8">
                  <p className="font-semibold">{commerce.owner_name}</p>
                  <p className="text-sm text-muted-foreground">CONTRATANTE</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {commerce.document_type === 'cnpj' ? 'CNPJ' : 'CPF'}: {commerce.document}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-foreground/30 pt-2 mt-8">
                  <p className="font-semibold">MOBDEGA</p>
                  <p className="text-sm text-muted-foreground">CONTRATADA</p>
                  <p className="text-xs text-muted-foreground mt-1">Plataforma Digital</p>
                </div>
              </div>
            </div>

            <div className="text-center mt-8 text-xs text-muted-foreground">
              <p>Data de Adesão: {commerce.approved_at 
                ? format(new Date(commerce.approved_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                : format(new Date(commerce.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
              }</p>
              <p className="flex items-center justify-center gap-1 mt-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Contrato aceito eletronicamente
              </p>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommerceContract;
