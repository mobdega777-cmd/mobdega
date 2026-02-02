import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  History, 
  Plus, 
  Pencil, 
  Settings, 
  ShoppingCart, 
  Package,
  Users,
  CreditCard,
  Tag,
  Truck,
  FileText,
  ChefHat
} from "lucide-react";

interface SystemUpdate {
  id: string;
  date: string;
  time: string;
  type: 'create' | 'update' | 'config';
  module: string;
  description: string;
}

// Lista estática de atualizações do sistema - pode ser expandida para buscar do banco
const systemUpdates: SystemUpdate[] = [
  {
    id: "n1",
    date: "01/02/2026",
    time: "10:30",
    type: "create",
    module: "Vitrine",
    description: "Novo botão de Mapa na vitrine do cliente para abrir localização do estabelecimento no Google Maps"
  },
  {
    id: "n2",
    date: "01/02/2026",
    time: "10:25",
    type: "update",
    module: "Comanda",
    description: "Tracker de status do pedido agora exibido diretamente na aba Comanda para acompanhamento contínuo"
  },
  {
    id: "n3",
    date: "01/02/2026",
    time: "10:20",
    type: "update",
    module: "Fórum",
    description: "Botão 'Marcar como Solução' movido para nível do tópico - indica que a discussão foi resolvida"
  },
  {
    id: "n4",
    date: "01/02/2026",
    time: "10:15",
    type: "update",
    module: "Página Inicial",
    description: "Cards de comércios na landing page agora clicáveis, abrindo diretamente a vitrine pública da loja"
  },
  {
    id: "0",
    date: "31/01/2026",
    time: "00:15",
    type: "create",
    module: "Segurança",
    description: "Nova aba de Segurança no painel admin para reset de senha temporária de comércios com exigência de troca no próximo login"
  },
  {
    id: "0a",
    date: "31/01/2026",
    time: "00:10",
    type: "create",
    module: "Autenticação",
    description: "Implementação do recurso de recuperação de senha via email para usuários e comércios"
  },
  {
    id: "0b",
    date: "31/01/2026",
    time: "00:05",
    type: "update",
    module: "Treinamento",
    description: "Seção de treinamento agora acessível durante período de aprovação, permitindo que comércios conheçam a plataforma enquanto aguardam"
  },
  {
    id: "1",
    date: "29/01/2026",
    time: "00:45",
    type: "update",
    module: "Financeiro",
    description: "Implementação de cálculo de faturamento líquido com desconto automático de taxas de operadoras (Débito/Crédito)"
  },
  {
    id: "2", 
    date: "29/01/2026",
    time: "00:40",
    type: "update",
    module: "Visão Geral",
    description: "Adição de tooltips de ajuda (?) em todos os cards de métricas para auxiliar na compreensão dos indicadores"
  },
  {
    id: "3",
    date: "29/01/2026",
    time: "00:35",
    type: "update",
    module: "Mesas/Comandas",
    description: "Correção: desconto de cupom agora aplicado corretamente ao host/solicitante no fechamento de conta separada"
  },
  {
    id: "4",
    date: "29/01/2026",
    time: "00:30",
    type: "update",
    module: "Fórum",
    description: "Correção de avatar do autor do tópico - agora utiliza logo do comércio quando author_type = commerce"
  },
  {
    id: "5",
    date: "29/01/2026",
    time: "00:25",
    type: "update",
    module: "Pedidos",
    description: "Correção de exibição no modal de detalhes - removido '0' indevido e adicionado suporte a coupon_code/discount"
  },
  {
    id: "6",
    date: "28/01/2026",
    time: "23:50",
    type: "create",
    module: "Fórum",
    description: "Adição de sistema de votação (Concordo/Não Concordo) para tópicos do fórum com contadores em tempo real"
  },
  {
    id: "7",
    date: "28/01/2026",
    time: "22:00",
    type: "config",
    module: "Pagamentos",
    description: "Novo sistema de configuração de taxas por método de pagamento (fee_percentage e fee_fixed) para cálculo preciso"
  },
  {
    id: "8",
    date: "28/01/2026",
    time: "21:30",
    type: "update",
    module: "Estoque",
    description: "Implementação de campo de custo de compra por produto para cálculo de margem de lucro real"
  },
  {
    id: "9",
    date: "28/01/2026",
    time: "20:00",
    type: "update",
    module: "Financeiro",
    description: "Migração de fonte de dados: cash_movements como fonte única de verdade para faturamento (evita duplicação)"
  },
  {
    id: "10",
    date: "28/01/2026",
    time: "19:30",
    type: "config",
    module: "Sistema",
    description: "Implementação de normalização de timezone (noon-anchoring) em dateUtils.ts para precisão no fuso BR (UTC-3)"
  },
  {
    id: "11",
    date: "28/01/2026",
    time: "18:00",
    type: "update",
    module: "Financeiro",
    description: "Novo card de Taxa de Crescimento com comparação automática do período anterior"
  },
  {
    id: "12",
    date: "28/01/2026",
    time: "17:00",
    type: "create",
    module: "Impostos",
    description: "Módulo de gestão tributária: configuração de regime, tipo de cálculo e alerta 2 dias antes do vencimento"
  },
  {
    id: "13",
    date: "28/01/2026",
    time: "16:00",
    type: "update",
    module: "Caixa/PDV",
    description: "Novo resumo detalhado no fechamento com totais por forma de pagamento e reconciliação de saldo"
  },
  {
    id: "14",
    date: "27/01/2026",
    time: "22:00",
    type: "update",
    module: "Ranking",
    description: "Adição de badges visuais por plano e destaque especial para líderes com gradientes e ícones"
  },
  {
    id: "15",
    date: "27/01/2026",
    time: "20:00",
    type: "create",
    module: "Fórum",
    description: "Lançamento do Fórum de Comunidade para adegas e tabacarias reportarem problemas e sugerirem melhorias"
  }
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'create': return <Plus className="w-3 h-3" />;
    case 'update': return <Pencil className="w-3 h-3" />;
    case 'config': return <Settings className="w-3 h-3" />;
    default: return <History className="w-3 h-3" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'create': return 'bg-green-500/20 text-green-500';
    case 'update': return 'bg-blue-500/20 text-blue-500';
    case 'config': return 'bg-purple-500/20 text-purple-500';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getModuleIcon = (module: string) => {
  switch (module.toLowerCase()) {
    case 'pedidos': return <ShoppingCart className="w-4 h-4" />;
    case 'produtos': 
    case 'estoque': return <Package className="w-4 h-4" />;
    case 'clientes': return <Users className="w-4 h-4" />;
    case 'pagamentos': 
    case 'financeiro': return <CreditCard className="w-4 h-4" />;
    case 'cupons': return <Tag className="w-4 h-4" />;
    case 'delivery': return <Truck className="w-4 h-4" />;
    case 'fórum': return <FileText className="w-4 h-4" />;
    case 'mesas/comandas':
    case 'caixa/pdv': return <ChefHat className="w-4 h-4" />;
    default: return <Settings className="w-4 h-4" />;
  }
};

const SystemUpdates = () => {
  return (
    <Card>
      <CardHeader className="p-4 md:p-6 pb-2">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <History className="w-4 h-4 md:w-5 md:h-5" />
          Atualizações do Sistema
        </CardTitle>
        <p className="text-xs text-muted-foreground">Últimas 15 modificações técnicas</p>
      </CardHeader>
      <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
          {systemUpdates.map((update) => (
            <div 
              key={update.id} 
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getModuleIcon(update.module)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getTypeColor(update.type)} border-none gap-1`}
                  >
                    {getTypeIcon(update.type)}
                    {update.type === 'create' ? 'Novo' : update.type === 'update' ? 'Atualização' : 'Config'}
                  </Badge>
                  <span className="text-xs font-medium text-foreground">{update.module}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {update.description}
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  {update.date} às {update.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemUpdates;