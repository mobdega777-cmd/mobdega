
-- Limpar registros antigos
DELETE FROM public.system_updates;

-- Inserir 20 implementações com timestamps escalonados
INSERT INTO public.system_updates (type, module, description, published_at) VALUES
('create', 'Fórum', 'Lançamento do Fórum de Comunidade para adegas e tabacarias reportarem problemas e sugerirem melhorias', '2025-01-27 10:00:00-03:00'),
('update', 'Ranking', 'Badges visuais por plano e destaque especial para líderes com gradientes e ícones', '2025-01-27 14:00:00-03:00'),
('create', 'Impostos', 'Módulo de gestão tributária com configuração de regime, tipo de cálculo e alerta antes do vencimento', '2025-01-28 09:00:00-03:00'),
('update', 'Caixa/PDV', 'Resumo detalhado no fechamento com totais por forma de pagamento e reconciliação de saldo', '2025-01-28 11:00:00-03:00'),
('config', 'Pagamentos', 'Sistema de configuração de taxas por método de pagamento para cálculo preciso de faturamento líquido', '2025-01-28 14:00:00-03:00'),
('create', 'Fórum', 'Sistema de votação (Concordo/Não Concordo) para tópicos do fórum com contadores em tempo real', '2025-01-28 16:00:00-03:00'),
('update', 'Financeiro', 'Cálculo de faturamento líquido com desconto automático de taxas de operadoras (Débito/Crédito)', '2025-01-29 10:00:00-03:00'),
('create', 'Segurança', 'Aba de Segurança no painel admin para reset de senha temporária de comércios', '2025-01-31 09:00:00-03:00'),
('create', 'Autenticação', 'Recurso de recuperação de senha via email para usuários e comércios', '2025-01-31 14:00:00-03:00'),
('create', 'Delivery', 'Aba "Acompanhar" na vitrine para clientes acompanharem pedidos de delivery em tempo real', '2025-02-02 10:00:00-03:00'),
('update', 'Caixa/PDV', 'Pedidos de Delivery contabilizados automaticamente no Caixa/PDV ao serem finalizados', '2025-02-02 15:00:00-03:00'),
('create', 'Configurações', 'Sistema de Modo Funcionário/Gestão com controle de visibilidade de menu e senha de gestão', '2025-02-03 10:00:00-03:00'),
('create', 'Notificações', 'Sistema de notificações do comércio com sino no cabeçalho e alertas de novas faturas', '2025-02-04 09:00:00-03:00'),
('create', 'Vitrine', 'Redes sociais (Instagram e Facebook) no perfil do comércio e exibição na vitrine', '2025-02-04 13:00:00-03:00'),
('create', 'Treinamento', 'Central de Treinamento com upload de vídeos, bucket de armazenamento e controle de acesso', '2025-02-04 16:00:00-03:00'),
('create', 'Avaliações', 'Sistema de avaliações com estrelas, resposta do comércio e notificação automática', '2025-02-08 10:00:00-03:00'),
('create', 'Estoque', 'Produtos compostos e fracionados com dedução automática de componentes ao entregar pedido', '2025-02-09 10:00:00-03:00'),
('update', 'Segurança', 'Políticas de segurança refinadas para perfis, caixa e notificações com acesso granular', '2025-02-09 15:00:00-03:00'),
('create', 'Treinamento', 'Checkbox de progresso nos vídeos de treinamento para acompanhar o que já foi assistido', '2025-02-14 10:00:00-03:00'),
('create', 'Notificações', 'Sistema completo de alertas: novos pedidos, estoque baixo, favoritos, fórum, caixa e atualizações do sistema', '2025-02-14 14:00:00-03:00');
