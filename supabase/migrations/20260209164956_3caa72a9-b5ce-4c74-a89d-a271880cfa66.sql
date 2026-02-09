-- Create system_updates table for dynamic changelog
CREATE TABLE public.system_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'update' CHECK (type IN ('create', 'update', 'config')),
  module TEXT NOT NULL,
  description TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_updates ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read updates
CREATE POLICY "Authenticated users can view system updates"
ON public.system_updates FOR SELECT
USING (auth.role() = 'authenticated');

-- Only master admins can manage updates
CREATE POLICY "Master admins can insert system updates"
ON public.system_updates FOR INSERT
WITH CHECK (public.is_master_admin());

CREATE POLICY "Master admins can update system updates"
ON public.system_updates FOR UPDATE
USING (public.is_master_admin());

CREATE POLICY "Master admins can delete system updates"
ON public.system_updates FOR DELETE
USING (public.is_master_admin());

-- Seed existing hardcoded updates
INSERT INTO public.system_updates (type, module, description, published_at) VALUES
('create', 'Visão Geral', 'Nova seção ''Insights Poderosos'' com métricas de BI: ticket médio, horário/dia de pico, taxa de retenção, produto campeão e dicas de marketing personalizadas', '2026-02-04 14:00:00-03'),
('create', 'Financeiro', 'Novo sistema de controle de pagamentos: despesas com data de vencimento, botão ''Pago'' para marcar quitação e cálculo automático nos cards A Pagar/Vencidos', '2026-02-04 10:00:00-03'),
('update', 'Impostos', 'Reset automático mensal do imposto: sistema agora verifica se pagamento foi feito no mês atual, exibindo botão ''Paguei'' ao virar o mês', '2026-02-04 09:55:00-03'),
('update', 'Financeiro', 'Paginação implementada na lista de Faturas e Cobranças (5 itens por página) para melhor navegação', '2026-02-04 09:50:00-03'),
('create', 'Configurações', 'Novo sistema de Modo Funcionário/Gestão: configure quais itens do menu são visíveis para funcionários e defina senha de gestão', '2026-02-03 14:00:00-03'),
('update', 'Caixa/PDV', 'Pedidos de Delivery agora são contabilizados automaticamente no Caixa/PDV ao serem finalizados, incluindo taxas', '2026-02-02 00:30:00-03'),
('create', 'Delivery', 'Nova aba ''Acompanhar'' na vitrine para clientes acompanharem pedidos de delivery após fechamento do modal', '2026-02-02 00:25:00-03'),
('create', 'Vitrine', 'Novo botão de Mapa na vitrine do cliente para abrir localização do estabelecimento no Google Maps', '2026-02-01 10:30:00-03'),
('update', 'Comanda', 'Tracker de status do pedido agora exibido diretamente na aba Comanda para acompanhamento contínuo', '2026-02-01 10:25:00-03'),
('update', 'Fórum', 'Botão ''Marcar como Solução'' movido para nível do tópico - indica que a discussão foi resolvida', '2026-02-01 10:20:00-03'),
('update', 'Página Inicial', 'Cards de comércios na landing page agora clicáveis, abrindo diretamente a vitrine pública da loja', '2026-02-01 10:15:00-03'),
('create', 'Segurança', 'Nova aba de Segurança no painel admin para reset de senha temporária de comércios com exigência de troca no próximo login', '2026-01-31 00:15:00-03'),
('create', 'Autenticação', 'Implementação do recurso de recuperação de senha via email para usuários e comércios', '2026-01-31 00:10:00-03'),
('update', 'Treinamento', 'Seção de treinamento agora acessível durante período de aprovação, permitindo que comércios conheçam a plataforma enquanto aguardam', '2026-01-31 00:05:00-03'),
('update', 'Financeiro', 'Implementação de cálculo de faturamento líquido com desconto automático de taxas de operadoras (Débito/Crédito)', '2026-01-29 00:45:00-03'),
('update', 'Visão Geral', 'Adição de tooltips de ajuda (?) em todos os cards de métricas para auxiliar na compreensão dos indicadores', '2026-01-29 00:40:00-03'),
('update', 'Mesas/Comandas', 'Correção: desconto de cupom agora aplicado corretamente ao host/solicitante no fechamento de conta separada', '2026-01-29 00:35:00-03'),
('update', 'Fórum', 'Correção de avatar do autor do tópico - agora utiliza logo do comércio quando author_type = commerce', '2026-01-29 00:30:00-03'),
('update', 'Pedidos', 'Correção de exibição no modal de detalhes - removido ''0'' indevido e adicionado suporte a coupon_code/discount', '2026-01-29 00:25:00-03'),
('create', 'Fórum', 'Adição de sistema de votação (Concordo/Não Concordo) para tópicos do fórum com contadores em tempo real', '2026-01-28 23:50:00-03'),
('config', 'Pagamentos', 'Novo sistema de configuração de taxas por método de pagamento (fee_percentage e fee_fixed) para cálculo preciso', '2026-01-28 22:00:00-03'),
('update', 'Estoque', 'Implementação de campo de custo de compra por produto para cálculo de margem de lucro real', '2026-01-28 21:30:00-03'),
('update', 'Financeiro', 'Migração de fonte de dados: cash_movements como fonte única de verdade para faturamento (evita duplicação)', '2026-01-28 20:00:00-03'),
('config', 'Sistema', 'Implementação de normalização de timezone (noon-anchoring) em dateUtils.ts para precisão no fuso BR (UTC-3)', '2026-01-28 19:30:00-03'),
('update', 'Financeiro', 'Novo card de Taxa de Crescimento com comparação automática do período anterior', '2026-01-28 18:00:00-03'),
('create', 'Impostos', 'Módulo de gestão tributária: configuração de regime, tipo de cálculo e alerta 2 dias antes do vencimento', '2026-01-28 17:00:00-03'),
('update', 'Caixa/PDV', 'Novo resumo detalhado no fechamento com totais por forma de pagamento e reconciliação de saldo', '2026-01-28 16:00:00-03'),
('update', 'Ranking', 'Adição de badges visuais por plano e destaque especial para líderes com gradientes e ícones', '2026-01-27 22:00:00-03'),
('create', 'Fórum', 'Lançamento do Fórum de Comunidade para adegas e tabacarias reportarem problemas e sugerirem melhorias', '2026-01-27 20:00:00-03');