## Mudança para Cobrança por Transação

### Visão geral
Substituir o modelo de planos mensais por uma **taxa por transação** definida pelo master admin. As faturas passam a ser geradas automaticamente com o acumulado de vendas do período.

---

### 1. Master Admin — substituir "Planos" por "Cobrança"

- **Renomear item de menu** em `AdminDashboard.tsx`: "Planos" → "Cobrança" (ícone Receipt/Percent).
- **Novo componente** `AdminBilling.tsx` (substitui o uso de `AdminPlans`):
  - Campos configuráveis (salvos em nova tabela `transaction_billing_config`, registro único):
    - **Tipo de cobrança**: `fixed` (R$ por venda) ou `percent` (% sobre o valor da venda)
    - **Valor**: ex.: R$ 0,50 por venda, ou 2% por venda
    - **Valor mínimo de fatura** (opcional)
    - **Descrição** que aparecerá na fatura
  - Preview de cálculo
- `AdminPlans.tsx` deixa de ser usado no menu (mantido no código por enquanto, sem rota).

### 2. Novo cálculo automático em "Enviar Fatura"

- Em `AdminInvoices.tsx`, ao abrir o modal **Nova Fatura** e escolher o comércio:
  - Buscar todas as vendas do comércio com `transaction_billed = false`
  - Calcular: `valor = soma_aplicando_config` (fixed × qtd ou percent × total)
  - Preencher automaticamente o campo **Valor (R$)** (editável caso master queira ajustar)
  - Mostrar resumo: "X vendas acumuladas — R$ Y"
- Ao **criar a fatura**:
  - Marcar todas as vendas usadas como `transaction_billed = true` e gravar `billed_invoice_id`
  - Próxima abertura do modal voltará a zero até novas vendas

### 3. Visão do comércio (anexo 2)
- Nenhuma mudança estrutural: a fatura aparece em **Faturas e Cobranças** com valor, vencimento e status (já funciona via `commerce_notifications` + `invoices`).
- Texto auxiliar: "Cobrança por transação — período X"

### 4. Cadastro do comércio (anexo 3) — `AuthModal.tsx`
- **Remover** a lista de planos com checkbox.
- Inserir bloco "Modelo de Cobrança" (somente leitura) buscando de `transaction_billing_config`:
  - Mostra: "Você pagará **R$ 0,50 por venda** (ou **2% por venda**)"
  - Checkbox obrigatório: "Li e concordo com o modelo de cobrança por transação"
  - Botão "Avançar" desabilitado enquanto não marcado
- **Remover** abertura do `RegistrationPaymentModal` no fim do cadastro — comércio entra direto no sistema (status `approved` automático ou conforme fluxo atual sem pagamento).
- Remover dependência de `plan_id` no insert de `commerces` (deixar `null`).

### 5. Telefone de suporte (anexo 4)
Atualizar para **11951012933** em:
- `src/components/commerce/CommerceSettings.tsx` (botão Suporte)
- `src/components/commerce/InvoicePaymentModal.tsx` (botão Ajuda)

---

### Detalhes técnicos (migration)

```sql
-- 1. Configuração global da taxa
CREATE TABLE public.transaction_billing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  charge_type text NOT NULL DEFAULT 'fixed', -- 'fixed' | 'percent'
  charge_value numeric NOT NULL DEFAULT 0,
  min_invoice_amount numeric DEFAULT 0,
  description text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.transaction_billing_config ENABLE ROW LEVEL SECURITY;
-- SELECT público (anon) p/ exibir no cadastro; UPDATE/INSERT só master_admin.

-- 2. Marcar vendas já cobradas
ALTER TABLE public.orders
  ADD COLUMN transaction_billed boolean DEFAULT false,
  ADD COLUMN billed_invoice_id uuid REFERENCES public.invoices(id);
CREATE INDEX idx_orders_transaction_billed ON public.orders(commerce_id, transaction_billed);

-- 3. RPC para o admin obter o acumulado por comércio
CREATE FUNCTION public.get_pending_transaction_billing(p_commerce_id uuid)
RETURNS TABLE(orders_count int, total_sales numeric, calculated_amount numeric) ...
```

- `AdminPlans.tsx`: removido do menu mas arquivo permanece (sem rota).
- `RegistrationPaymentModal`: import removido do `AuthModal`; arquivo mantido.
- Memória `mem://features/commerce/registration-onboarding-logic` será atualizada para refletir o novo fluxo sem pagamento upfront.

### Fora de escopo
- Migração retroativa de comércios já existentes em planos (continuam com `plan_id` antigo até serem editados manualmente).
- Cobrança automática real (PIX/cartão) — segue manual via fatura.