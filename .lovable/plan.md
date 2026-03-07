

## Plano: Modal de Pagamento PIX após Cadastro de Comércio

### Contexto
Atualmente, ao finalizar o cadastro de comércio, o `handleCommerceRegister` no `AuthModal.tsx` simplesmente exibe um toast e fecha o modal. O objetivo é interceptar esse fluxo para exibir um modal de pagamento com os dados PIX do Master Admin (tabela `billing_config`) antes de fazer login automático.

### Mudanças

#### 1. Criar componente `RegistrationPaymentModal`
**Novo arquivo:** `src/components/auth/RegistrationPaymentModal.tsx`

- Recebe props: `isOpen`, `onConfirmPayment`, plano selecionado (nome + preço), desconto do cupom se houver
- Ao abrir, busca dados da `billing_config` (chave PIX, tipo, QR Code, favorecido, banco, CNPJ) — usa uma RPC pública pois o usuário acabou de se cadastrar e pode não ter permissão via RLS atual
- Exibe: valor do plano, dados PIX (chave, tipo, favorecido, banco), QR Code se disponível
- Botão "Já realizei o pagamento" que chama `onConfirmPayment`

#### 2. Criar RPC `get_billing_config_public` (migração SQL)
A tabela `billing_config` tem RLS restritiva (apenas master admin e comércios aprovados podem ler). Precisa de uma função SECURITY DEFINER que retorne apenas os dados de pagamento sem expor tudo:

```sql
CREATE OR REPLACE FUNCTION public.get_billing_config_public()
RETURNS TABLE(pix_key text, pix_key_type text, qr_code_url text, bank_name text, account_holder text, cnpj text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT pix_key, pix_key_type, qr_code_url, bank_name, account_holder, cnpj
  FROM public.billing_config LIMIT 1;
$$;
```

#### 3. Modificar `AuthModal.tsx` — `handleCommerceRegister`
- Adicionar estado `showPaymentModal` e dados do plano selecionado
- Após criar o comércio com sucesso (linha ~344), em vez de chamar `handleClose()`, setar `showPaymentModal = true`
- No callback `onConfirmPayment`: fazer login automático (já está logado pelo signUp), fechar tudo e navegar para `/commerce`

#### 4. Renderizar o modal no `AuthModal`
- Adicionar `<RegistrationPaymentModal>` no JSX do AuthModal
- Quando o usuário confirma pagamento, fecha o AuthModal e navega para `/commerce`

### Fluxo Final
1. Usuário preenche cadastro → clica "Cadastrar"
2. Conta + comércio criados no banco
3. Modal de pagamento PIX abre com dados do Master Admin
4. Usuário faz o PIX e clica "Já realizei o pagamento"
5. Login automático (já autenticado pelo signUp) → navega para `/commerce`
6. Comércio fica com status `pending` aguardando aprovação do admin

