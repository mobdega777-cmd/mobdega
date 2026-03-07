CREATE OR REPLACE FUNCTION public.get_billing_config_public()
RETURNS TABLE(pix_key text, pix_key_type text, qr_code_url text, bank_name text, account_holder text, cnpj text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT pix_key, pix_key_type, qr_code_url, bank_name, account_holder, cnpj
  FROM public.billing_config LIMIT 1;
$$;