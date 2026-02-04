

# Plano: Sistema de Controle de Pagamentos e Vencimentos

## Resumo
Implementar um sistema completo de controle de pagamentos para impostos e despesas, incluindo:
1. Reset automático do status de pagamento de impostos quando virar o mês
2. Data de vencimento para despesas (gastos fixos/variáveis)
3. Botão "Pago" para cada despesa na lista
4. Cards "A Pagar" e "Vencidos" calculando valores de despesas pendentes/vencidas
5. Paginação da lista de Faturas e Cobranças (5 itens por página)

---

## Problema 1: Imposto Estimado - Reset Automático Mensal

### Situação Atual
O campo `tax_paid_current_month` é um boolean simples que fica `true` após o usuário clicar em "Paguei". Porém, quando o mês vira, o sistema não reseta esse campo automaticamente.

### Solução
Modificar a lógica de exibição do card de Imposto para verificar se o `tax_paid_at` pertence ao mês atual:
- Se `tax_paid_at` for do mês atual -> exibir "Pago"
- Se `tax_paid_at` for de mês anterior ou não existir -> exibir botão "Paguei"

Não precisará de migração de banco, apenas mudança de lógica no frontend.

---

## Problema 2 e 3: Data de Vencimento e Botão "Pago" para Despesas

### Alterações Necessárias

#### Migração do Banco de Dados
Adicionar novas colunas na tabela `expenses`:

```sql
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS due_date date,
ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;
```

#### Interface do Modal "Novo Gasto"
- Adicionar campo de data de vencimento (datepicker/calendário)
- O campo de data será opcional para despesas sem vencimento fixo

#### Lista de Gastos Fixos e Variáveis
- Adicionar nova coluna "Vencimento"
- Adicionar coluna com botão "Pago" para cada linha
- Quando clicado em "Pago":
  - Atualizar `is_paid = true` e `paid_at = now()`
  - Deduzir valor do card "A Pagar"

---

## Problema 4: Cards "A Pagar" e "Vencidos" com Despesas

### Lógica de Cálculo

**Card "A Pagar (Pendente)":**
- Soma de todos os gastos com `is_paid = false` e `due_date >= today`
- Inclui também faturas (invoices) pendentes
- Inclui imposto estimado se ainda não foi pago no mês atual

**Card "Vencidos":**
- Soma de todos os gastos com `is_paid = false` e `due_date < today`
- Inclui faturas com status "overdue"
- Inclui imposto se passou o dia de vencimento e não foi pago

---

## Problema 5: Paginação de Faturas e Cobranças

### Implementação
- Adicionar estado `currentPage` (inicia em 1)
- Constante `ITEMS_PER_PAGE = 5`
- Exibir apenas `invoices.slice((currentPage - 1) * 5, currentPage * 5)`
- Adicionar componente de paginação abaixo da tabela

---

## Detalhes Técnicos

### 1. Migração do Banco de Dados

```sql
-- Adicionar campos de vencimento e pagamento para despesas
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS due_date date,
ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;
```

### 2. Lógica de Reset do Imposto (CommerceFinancial.tsx)

```typescript
// Verificar se o pagamento do imposto foi feito no mês atual
const isTaxPaidThisMonth = () => {
  if (!commerce?.tax_paid_at) return false;
  const paidDate = new Date(commerce.tax_paid_at);
  const now = new Date();
  return paidDate.getMonth() === now.getMonth() && 
         paidDate.getFullYear() === now.getFullYear();
};

// Usar isTaxPaidThisMonth() em vez de commerce?.tax_paid_current_month
```

### 3. Atualização do CommerceExpenses.tsx

**Interface atualizada:**
```typescript
interface Expense {
  id: string;
  name: string;
  type: 'fixed' | 'variable' | 'stock_purchase';
  amount: number;
  description: string | null;
  is_active: boolean;
  due_date: string | null;  // NOVO
  is_paid: boolean;         // NOVO
  paid_at: string | null;   // NOVO
}
```

**Novo formData:**
```typescript
const [formData, setFormData] = useState({
  name: '',
  type: 'fixed' as 'fixed' | 'variable' | 'stock_purchase',
  amount: '',
  description: '',
  due_date: ''  // NOVO
});
```

**Nova função de pagamento:**
```typescript
const handleMarkAsPaid = async (expenseId: string) => {
  await supabase
    .from('expenses')
    .update({ is_paid: true, paid_at: new Date().toISOString() })
    .eq('id', expenseId);
  fetchExpenses();
  toast({ title: "Despesa marcada como paga!" });
};
```

### 4. Cálculo dos Cards A Pagar e Vencidos

No `CommerceFinancial.tsx`, modificar o cálculo:

```typescript
// Buscar despesas com dados de vencimento
const { data: expensesData } = await supabase
  .from('expenses')
  .select('*')
  .eq('commerce_id', commerceId)
  .eq('is_active', true);

const today = new Date().toISOString().split('T')[0];

// Despesas pendentes (não pagas e não vencidas)
const pendingExpenses = expensesData?.filter(e => 
  !e.is_paid && e.due_date && e.due_date >= today
).reduce((sum, e) => sum + Number(e.amount), 0) || 0;

// Despesas vencidas (não pagas e já vencidas)
const overdueExpenses = expensesData?.filter(e => 
  !e.is_paid && e.due_date && e.due_date < today
).reduce((sum, e) => sum + Number(e.amount), 0) || 0;

// Total A Pagar = Faturas pendentes + Despesas pendentes + Imposto pendente
const totalPending = pendingPayments + pendingExpenses + (isTaxPaidThisMonth() ? 0 : stats.taxAmount);

// Total Vencidos = Faturas vencidas + Despesas vencidas + Imposto vencido
const totalOverdue = overduePayments + overdueExpenses + overdueFromTax;
```

### 5. Paginação de Faturas

```typescript
const INVOICES_PER_PAGE = 5;
const [invoicesPage, setInvoicesPage] = useState(1);
const totalInvoicePages = Math.ceil(invoices.length / INVOICES_PER_PAGE);
const paginatedInvoices = invoices.slice(
  (invoicesPage - 1) * INVOICES_PER_PAGE, 
  invoicesPage * INVOICES_PER_PAGE
);
```

---

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `supabase/migrations/...` | Adicionar colunas due_date, is_paid, paid_at em expenses |
| `src/components/commerce/CommerceFinancial.tsx` | Logica de reset do imposto, calculo de A Pagar/Vencidos com despesas, paginacao |
| `src/components/commerce/CommerceExpenses.tsx` | Datepicker no modal, coluna de vencimento, botao Pago na lista |
| `src/components/commerce/SystemUpdates.tsx` | Registrar novas funcionalidades |

---

## Fluxo de Uso

```text
IMPOSTO ESTIMADO:
┌─────────────────────────────────────────────────────────────┐
│  1. Usuario clica "Paguei" no card de Imposto               │
│  2. Sistema grava tax_paid_at = agora                       │
│  3. Card exibe badge "Pago"                                 │
│  4. Quando virar o mes, sistema detecta que tax_paid_at     │
│     e do mes anterior                                       │
│  5. Botao "Paguei" volta a aparecer automaticamente         │
└─────────────────────────────────────────────────────────────┘

DESPESAS COM VENCIMENTO:
┌─────────────────────────────────────────────────────────────┐
│  1. Admin cria novo gasto com data de vencimento            │
│  2. Card "A Pagar" soma o valor                             │
│  3. Quando data de vencimento passa sem clicar "Pago"       │
│  4. Valor migra para card "Vencidos"                        │
│  5. Admin clica "Pago" na linha da despesa                  │
│  6. Valor e deduzido dos cards                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Componentes Visuais

### Modal "Novo Gasto" Atualizado
- Campo: Nome do Gasto
- Campo: Tipo (Fixo/Variavel/Compra Estoque)
- Campo: Valor (R$)
- Campo: **Data de Vencimento** (novo datepicker)
- Campo: Descricao (opcional)

### Tabela de Gastos Atualizada
| Nome | Tipo | Valor | Vencimento | Descricao | Status | Acoes |
|------|------|-------|------------|-----------|--------|-------|
| Aluguel | Fixo | R$ 500 | 10/02/2026 | - | [Pago] | Editar/Excluir |
| Sistema | Fixo | R$ 250 | 15/02/2026 | - | [Pagar] | Editar/Excluir |

### Lista de Faturas com Paginacao
- Exibir 5 faturas por pagina
- Navegacao: < Anterior | Pagina 1 de 3 | Proximo >

