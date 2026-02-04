
# Plano: Melhorias no Filtro de Datas do Sistema

## Resumo

Este plano aborda duas melhorias solicitadas para os filtros de data em todo o sistema:
1. Adicionar a opção "Esse mês" após "30 dias" em todos os filtros
2. Adicionar botão "Limpar" no calendário personalizado
3. Melhorar a performance na troca de filtros

---

## Componentes Afetados

O filtro de datas (`DateFilter`) é usado em 5 locais do sistema:

| Componente | Tipo | Localização |
|------------|------|-------------|
| `CommerceFinancial.tsx` | Admin Comércio | Financeiro |
| `CommerceOverview.tsx` | Admin Comércio | Visão Geral |
| `CommerceOrders.tsx` | Admin Comércio | Pedidos |
| `CommerceCashRegister.tsx` | Admin Comércio | Caixa |
| `AdminFinancial.tsx` | Master Admin | Financeiro |

---

## Alterações Planejadas

### 1. Atualizar DateFilter.tsx (Componente Central)

**Adicionar nova opção "Esse mês":**
- Incluir `{ value: "thisMonth", label: "Esse mês" }` após "30 dias"
- Implementar lógica que calcula do dia 1 do mês atual até hoje

**Adicionar botão "Limpar" no calendário:**
- Inserir botão ao lado de "Cancelar" no popover do calendário
- Ao clicar, limpar a seleção (`dateRange`) permitindo nova escolha

**Melhorar performance:**
- Adicionar `useMemo` para evitar recálculos desnecessários
- Otimizar as funções `getDisplayValue` e `getDateRange`

### 2. Atualizar dateUtils.ts

Adicionar função helper para obter o range do mês atual:
```typescript
export const getThisMonthDateRange = (): { start: Date; end: Date } => {
  const today = getLocalToday();
  return {
    start: startOfMonth(today),
    end: endOfDay(today)
  };
};
```

### 3. Atualizar getDateRange() no DateFilter

Adicionar caso para "thisMonth":
```typescript
case "thisMonth":
  return { 
    start: startOfMonth(today), 
    end: endDate 
  };
```

---

## Interface Visual

### Antes (Atual)
```
Hoje
Ontem
7 dias
15 dias
30 dias
Personalizar
```

### Depois (Proposto)
```
Hoje
Ontem
7 dias
15 dias
30 dias
Esse mês      <-- NOVO
Personalizar
```

### Botões do Calendário Personalizado

**Antes:**
```
[Cancelar]
```

**Depois:**
```
[Limpar] [Cancelar]
```

---

## Detalhes Técnicos

### Alterações em src/components/commerce/DateFilter.tsx

```typescript
// 1. Atualizar array de opções
const dateOptions = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "7days", label: "7 dias" },
  { value: "15days", label: "15 dias" },
  { value: "30days", label: "30 dias" },
  { value: "thisMonth", label: "Esse mês" },  // NOVO
  { value: "custom", label: "Personalizar" },
];

// 2. Atualizar getDateRange para incluir "thisMonth"
case "thisMonth":
  return { 
    start: startOfDay(startOfMonth(today)), 
    end: endDate 
  };

// 3. Adicionar função para limpar seleção
const handleClearSelection = () => {
  setDateRange(undefined);
};

// 4. Adicionar botão Limpar no JSX do calendário
<Button 
  variant="ghost" 
  size="sm"
  onClick={handleClearSelection}
>
  Limpar
</Button>
```

### Alterações em src/lib/dateUtils.ts

```typescript
// Adicionar import
import { startOfMonth } from "date-fns";

// Adicionar nova função
export const getThisMonthDateRange = (): { start: Date; end: Date } => {
  const today = getLocalToday();
  return {
    start: startOfDay(startOfMonth(today)),
    end: endOfDay(today)
  };
};
```

### Otimizações de Performance

1. **Memoização**: Usar `useMemo` para cálculos de datas
2. **Transições suaves**: Evitar re-renders desnecessários
3. **Import otimizado**: Importar apenas funções necessárias do date-fns

---

## Arquivos a Modificar

| Arquivo | Tipo de Alteração |
|---------|-------------------|
| `src/components/commerce/DateFilter.tsx` | Adicionar opção "Esse mês", botão "Limpar", otimizações |
| `src/lib/dateUtils.ts` | Adicionar helper `getThisMonthDateRange` |

---

## Resultado Esperado

1. Todos os filtros de data do sistema (Admin Master e Admin Comércio) terão a opção "Esse mês"
2. Ao selecionar "Esse mês", o sistema filtrará do dia 1 do mês atual até o dia de hoje
3. No calendário personalizado, o botão "Limpar" permitirá reiniciar a seleção
4. A troca entre filtros será mais rápida devido às otimizações de memoização

