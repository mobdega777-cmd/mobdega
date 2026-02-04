
# Plano: Eliminar Delay Visual na Troca de Filtros de Data

## Problema Identificado

Quando o usuário troca o filtro de data (ex: "30 dias" para "Esse mês"), os **dados antigos continuam sendo exibidos** enquanto os novos dados são carregados. Isso causa um "flash" visual de valores incorretos ou negativos, conforme demonstrado nas imagens.

**Causa raiz técnica:**
- O estado de `loading` não é resetado para `true` quando o filtro muda
- Os valores nos cards não são limpos durante a transição
- O `useEffect` chama `fetchData()` mas não indica visualmente que está carregando

---

## Solução Proposta

Implementar **loading instantâneo** quando o filtro de data mudar, garantindo que:
1. Os cards mostrem um skeleton/loading imediatamente ao trocar filtro
2. Os dados antigos não apareçam durante a transição
3. A experiência seja fluida e sem "flashes" de valores incorretos

---

## Componentes a Modificar

| Componente | Localização |
|------------|-------------|
| `CommerceFinancial.tsx` | Admin Comércio - Financeiro |
| `CommerceOverview.tsx` | Admin Comércio - Visão Geral |
| `CommerceOrders.tsx` | Admin Comércio - Pedidos |

---

## Alterações Técnicas

### 1. CommerceFinancial.tsx

**Problema atual (linha 149-151, 400-402):**
```typescript
const handleDateChange = (start: Date, end: Date) => {
  setDateFilter({ start, end });
  // loading não é resetado!
};

useEffect(() => {
  fetchData(); // dados antigos continuam visíveis
}, [commerceId, dateFilter]);
```

**Solução:**
```typescript
const handleDateChange = (start: Date, end: Date) => {
  setLoading(true); // Mostra loading IMEDIATAMENTE
  setDateFilter({ start, end });
};

// Alternativa: resetar loading no início do useEffect
useEffect(() => {
  setLoading(true);
  fetchData();
}, [commerceId, dateFilter]);
```

**Adicionar skeleton nos cards durante loading:**
- Quando `loading === true`, exibir componentes `Skeleton` nos valores dos cards
- Isso elimina completamente o flash de dados antigos

### 2. CommerceOverview.tsx

**Problema atual (linha 106-164):**
- O `loading` não é resetado quando `dateFilter` muda
- Linha 207: O spinner só aparece no carregamento inicial

**Solução:**
```typescript
useEffect(() => {
  const fetchStats = async () => {
    setLoading(true); // ADICIONAR: Reset loading ao iniciar
    // ... resto do código
  };
  fetchStats();
}, [commerce.id, dateFilter]);
```

### 3. CommerceOrders.tsx

Aplicar o mesmo padrão de reset de loading no useEffect.

---

## Implementação Visual

### Skeleton para Cards Financeiros

Em vez de mostrar valores antigos durante o loading, exibir:

```typescript
{loading ? (
  <Skeleton className="h-8 w-24" />
) : (
  <span className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</span>
)}
```

---

## Fluxo Antes vs Depois

**Antes (problema atual):**
```
1. Usuário clica "Esse mês"
2. Estado dateFilter atualiza
3. fetchData() começa (assíncrono)
4. DADOS ANTIGOS continuam visíveis (FLASH!)
5. Dados novos chegam e substituem
```

**Depois (solução):**
```
1. Usuário clica "Esse mês"
2. loading = true (IMEDIATO)
3. Cards mostram Skeleton
4. fetchData() busca dados
5. Dados novos substituem skeleton
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/commerce/CommerceFinancial.tsx` | Resetar loading no handleDateChange ou useEffect, adicionar skeletons nos cards |
| `src/components/commerce/CommerceOverview.tsx` | Resetar loading no início do fetchStats |
| `src/components/commerce/CommerceOrders.tsx` | Resetar loading quando filtro mudar |

---

## Resultado Esperado

1. **Transição instantânea**: Ao trocar filtro, cards exibem skeleton imediatamente
2. **Sem flash de dados antigos**: Usuário não vê valores negativos ou incorretos
3. **Feedback visual claro**: Loading indica que novos dados estão sendo buscados
4. **Experiência profissional**: Análise de dados confiável sem confusão visual
