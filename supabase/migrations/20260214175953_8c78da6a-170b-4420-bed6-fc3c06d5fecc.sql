
-- Drop operational triggers that pollute system_updates
DROP TRIGGER IF EXISTS trg_system_update_commerces ON public.commerces;
DROP TRIGGER IF EXISTS trg_system_update_invoices ON public.invoices;
DROP TRIGGER IF EXISTS trg_system_update_plans ON public.plans;

-- Drop the function
DROP FUNCTION IF EXISTS public.log_system_update();

-- Delete all existing operational data
DELETE FROM public.system_updates;

-- Insert real platform implementation records
INSERT INTO public.system_updates (type, module, description, published_at) VALUES
('create', 'Treinamento', 'Adicionado checkbox de progresso nos vídeos de treinamento para acompanhar o que já foi assistido', now() - interval '2 hours'),
('update', 'Estoque', 'Botão de Relatório de Estoque movido da aba Financeiro para Controle de Estoque', now() - interval '1 hour'),
('update', 'Treinamento', 'Aviso de carregamento e otimização de performance dos vídeos na página de treinamento', now());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_updates;
