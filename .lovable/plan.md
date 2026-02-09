

# Plano: Correção do Caixa/PDV e Nova Tela de Gestão de Caixa

## Problema Identificado

O caixa da Adega Premium foi aberto em **06/02** e nunca foi fechado. Desde então, vendas foram registradas nos dias 07/02 e 08/02. Porém, os cards (Vendas, Entradas, Sangrias, etc.) filtram por "Hoje" como padrão, o que faz com que movimentações de dias anteriores **desapareçam dos cards**. O correto e que, enquanto o caixa estiver aberto, **todos os valores desde a abertura** apareçam nos cards, independente de ter passado meia-noite.

## Solucao em 3 Partes

---

### Parte 1 -- Corrigir exibicao dos cards quando o caixa esta aberto

**Comportamento atual:** Os cards usam `filteredMovements` (filtrados pelo dateFilter, que por padrao e "hoje").

**Comportamento correto:** Quando o caixa esta aberto, os cards devem usar **todos os movimentos do caixa aberto** (sem filtro de data). O filtro de data so deve afetar a tabela de Movimentacoes abaixo, nao os cards.

- Alterar `calculateTotals()` para usar `movements` (todas do caixa) em vez de `filteredMovements` quando `currentRegister` estiver definido
- Alterar `calculatePaymentMethodTotals()` da mesma forma
- Manter `filteredMovements` apenas para a tabela de Movimentacoes

---

### Parte 2 -- Botao "Gestao Caixa" com tela de historico

Adicionar um botao **"Gestao Caixa"** ao lado do botao "Venda", que abre um dialog/modal com:

- **Lista paginada** (10 registros por pagina) de todos os caixas fechados
- Cada registro mostra:
  - Data de abertura e fechamento (dia e hora)
  - Valor de abertura
  - Valor de fechamento
  - Valor esperado
  - Diferenca (positiva/negativa)
  - Status de conferencia (100% conferido se diferenca = 0)
  - Resumo por forma de pagamento (buscando movimentos daquele caixa)
- **Insights por fechamento**: ao lado de cada registro, um mini-resumo com:
  - Total de vendas
  - Ticket medio
  - Forma de pagamento mais usada
  - Duracao do turno (abertura ate fechamento)

---

### Parte 3 -- Detalhes Tecnicos

**Arquivo principal modificado:** `src/components/commerce/CommerceCashRegister.tsx`

**Mudancas no `calculateTotals()`:**
```text
Quando currentRegister != null:
  -> usar `movements` (todos do caixa aberto)
Quando currentRegister == null:
  -> usar `filteredMovements` (como hoje)
```

**Novo estado e funcoes:**
- `cashManagementOpen` (boolean) para controlar o modal
- `closedRegisters` (array) para armazenar o historico
- `registersPage` (number) para paginacao
- `fetchClosedRegisters()` para buscar caixas fechados com seus movimentos

**Nova consulta:**
- Buscar `cash_registers` com `status = 'closed'` ordenados por `closed_at DESC`
- Para cada registro, buscar movimentos associados via `cash_register_id`
- Calcular insights (ticket medio, forma mais usada, duracao)

**Novo componente visual (dentro do mesmo arquivo):**
- Modal "Gestao de Caixa" com cards expansiveis por fechamento
- Paginacao com 10 itens por pagina
- Badges de status (conferido/divergencia)
- Cores: verde para diferenca = 0, vermelho para divergencia

**Icone sugerido:** `ClipboardList` ou `BarChart3` (ja importados)

