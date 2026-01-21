-- Insert footer customization section if not exists
INSERT INTO public.site_customizations (section, title, description, metadata, is_active)
SELECT 'footer', 'Rodapé', 'A plataforma que conecta você às melhores adegas e tabacarias da sua região.', 
  '{"email": "contato@mobdega.com.br", "phone": "(11) 99999-9999", "address": "São Paulo, SP\nBrasil", "instagram": "#", "facebook": "#", "twitter": "#"}'::jsonb, 
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_customizations WHERE section = 'footer'
);