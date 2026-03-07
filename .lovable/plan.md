

## Plano: Remover limitação de 1000 linhas em todas as consultas

### Problema
O Supabase tem um limite padrão de 1000 linhas por consulta. Queries que não usam `.limit()` ou `.range()` retornam no máximo 1000 registros silenciosamente, o que pode causar dados incompletos em relatórios, listas e cálculos financeiros.

### Solução
Criar uma função utilitária `fetchAllRows` que pagina automaticamente qualquer consulta, buscando todos os registros em lotes de 1000. Substituir todas as consultas que podem ultrapassar 1000 linhas.

### 1. Criar utilitário `src/lib/supabaseHelper.ts`
Função genérica que recebe um query builder e faz paginação automática em lotes de 1000, retornando todos os registros.

### 2. Arquivos a modificar (consultas sem limite que podem crescer)

**Admin:**
- `AdminOverview.tsx` — `invoices.select('amount, status')` e `commerces.select('status')` sem limite
- `AdminInvoices.tsx` — `invoices.select('*')` sem limite
- `AdminCommerces.tsx` — `commerces.select('*')` sem limite
- `AdminUsers.tsx` — `profiles.select('*')` sem limite
- `AdminFinancial.tsx` — `financial_transactions`, `invoices`, `commerces` sem limite

**Commerce:**
- `CommerceOrders.tsx` — `orders.select('*')` filtrado por data mas sem limite
- `CommerceFinancial.tsx` — `cash_movements`, `orders`, `order_items`, `expenses`, `reviews`, `favorites` sem limite (relatório PDF incluso)
- `CommerceProducts.tsx` — `products.select('*')` sem limite
- `CommerceTables.tsx` — `tables.select('*')` sem limite (baixo risco mas prevenir)

**Nota:** `CommerceCustomers.tsx` já implementa paginação manual — está OK.

### 3. Implementação
Em cada arquivo, substituir chamadas simples `.select()` sem `.limit()` pela função `fetchAllRows`, que internamente faz:
```
loop: .range(offset, offset+999) até retornar menos de 1000
```

Consultas com `.limit()` explícito (notificações, últimos registros, etc.) permanecem inalteradas pois são intencionais.

### Sem alterações no banco de dados

