-- Atualiza a função para buscar o email diretamente de auth.users via owner_id
-- Isso garante que o login por CPF/CNPJ sempre use o email de autenticação correto
CREATE OR REPLACE FUNCTION public.get_commerce_email_by_document(p_document text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT au.email 
  FROM public.commerces c
  JOIN auth.users au ON au.id = c.owner_id
  WHERE REGEXP_REPLACE(c.document, '\D', '', 'g') = REGEXP_REPLACE(p_document, '\D', '', 'g')
  LIMIT 1;
$$;