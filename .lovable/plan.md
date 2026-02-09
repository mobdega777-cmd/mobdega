

# Plano: Botao Reset no Card de Imposto + Imposto como Gasto Fixo na Lista

## Resumo

Duas mudancas no modulo financeiro do comercio:

1. **Botao Reset** no card "Imposto Estimado": permite estornar a acao de "Paguei", retornando o status para pendente.
2. **Imposto como gasto fixo na lista**: ao configurar o regime tributario, o sistema cria automaticamente um registro na tabela de expenses como gasto fixo, com o valor e dia de vencimento configurados. O botao "Paguei" do card de imposto sincroniza com o status desse gasto na lista.

---

## Parte 1 -- Botao Reset no Card de Imposto

**Arquivo:** `src/components/commerce/CommerceFinancial.tsx`

- Adicionar funcao `handleResetTaxPayment` que faz UPDATE na tabela `commerces`: `tax_paid_current_month = false`, `tax_paid_at = null`
- Tambem atualiza o expense correspondente (tipo fixo com nome "Imposto") para `is_paid = false`, `paid_at = null`
- Adicionar botao "Reset" acima do botao "Configurar", visivel apenas quando `taxPaidThisMonth === true`
- Estilo: botao outline/destructive pequeno

**Resultado visual (area de botoes):**
```text
[Pago]          (badge verde, visivel quando pago)
[Reset]         (visivel quando pago)
[Configurar]    (sempre visivel)
```

---

## Parte 2 -- Imposto como Gasto Fixo na Lista de Expenses

**Arquivo:** `src/components/commerce/CommerceFinancial.tsx`

Ao salvar a configuracao de imposto (no callback `onSave` do TaxConfigModal), o sistema deve:

1. Verificar se ja existe um expense do tipo fixo com nome "Imposto - [Regime]" para este comercio
2. Se existir: atualizar valor e due_date
3. Se nao existir: inserir novo expense fixo

**Arquivo:** `src/components/commerce/TaxConfigModal.tsx`

- Adicionar ao `onSave` a logica de upsert do expense. O `onSave` ja recebe o `commerceId` e os dados de configuracao.
- Alternativamente, criar essa logica no `CommerceFinancial.tsx` no callback pos-save do modal.

**Sincronizacao do botao "Paguei":**

Quando o usuario clica "Paguei" no card de imposto (`handleMarkAsPaid`):
- Alem de atualizar `commerces.tax_paid_current_month` e `tax_paid_at`, tambem faz UPDATE no expense correspondente: `is_paid = true`, `paid_at = now()`

Quando clica "Reset" (`handleResetTaxPayment`):
- Reverte ambos: commerce e expense

---

## Detalhes Tecnicos

**Identificacao do expense de imposto:**
O expense sera identificado pela combinacao `commerce_id` + `name LIKE 'Imposto%'` + `type = 'fixed'`.

**handleMarkAsPaid atualizado:**
```text
1. UPDATE commerces SET tax_paid_current_month = true, tax_paid_at = now()
2. UPDATE expenses SET is_paid = true, paid_at = now() WHERE commerce_id = X AND name LIKE 'Imposto%' AND type = 'fixed'
3. fetchData()
```

**handleResetTaxPayment (novo):**
```text
1. UPDATE commerces SET tax_paid_current_month = false, tax_paid_at = null
2. UPDATE expenses SET is_paid = false, paid_at = null WHERE commerce_id = X AND name LIKE 'Imposto%' AND type = 'fixed'
3. fetchData()
```

**Criacao/atualizacao do expense ao configurar imposto:**
```text
Nome: "Imposto - MEI" (ou Simples, etc)
Tipo: fixed
Valor: tax_value (fixo) ou calculado (percentual)
due_date: dia tax_payment_day do mes atual
```

**Arquivos modificados:**
- `src/components/commerce/CommerceFinancial.tsx` -- botao reset, sync pago/reset com expenses, criacao de expense ao salvar config
