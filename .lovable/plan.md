
# Plano: Incluir Regime Tributario no Card de Custos Totais

## Resumo

O card "Custos Totais" na tela de Gastos atualmente soma apenas gastos fixos, variaveis e taxas de operadoras. O valor do imposto (regime tributario configurado) nao esta sendo contabilizado. A mudanca inclui o imposto nesse calculo.

---

## Mudancas

### 1. Passar `taxAmount` como prop para CommerceExpenses

**Arquivo:** `src/components/commerce/CommerceFinancial.tsx`

O `taxAmount` ja e calculado neste componente (linhas 360-365). Basta passa-lo como prop ao renderizar `<CommerceExpenses>`.

### 2. Receber e usar `taxAmount` no CommerceExpenses

**Arquivo:** `src/components/commerce/CommerceExpenses.tsx`

- Adicionar `taxAmount?: number` na interface `CommerceExpensesProps`
- Receber a prop no componente (default 0)
- Alterar o calculo de `totalExpenses` (linha 240):
  - De: `totalFixedExpenses + totalVariableExpenses + operatorFees`
  - Para: `totalFixedExpenses + totalVariableExpenses + operatorFees + taxAmount`
- Atualizar o detalhamento abaixo do valor no card (linha 294) para incluir "Impostos: R$ X"
- Atualizar o tooltip para mencionar impostos
- O `netProfit` e `profitMargin` ja derivam de `totalExpenses`, entao serao ajustados automaticamente

---

## Detalhes Tecnicos

**CommerceExpensesProps** (novo campo):
```text
taxAmount?: number  (default: 0)
```

**Calculo atualizado:**
```text
totalExpenses = totalFixedExpenses + totalVariableExpenses + operatorFees + taxAmount
```

**Detalhamento no card:**
```text
Fixos: R$ X | Var: R$ X | Taxas: R$ X | Impostos: R$ X
```

**Arquivos modificados:**
- `src/components/commerce/CommerceFinancial.tsx` -- passar prop taxAmount
- `src/components/commerce/CommerceExpenses.tsx` -- receber prop e incluir no calculo
