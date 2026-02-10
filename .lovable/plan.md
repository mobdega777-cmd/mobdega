

## Correcao: Valor de Venda de Produtos Fracionados

### Problema Identificado

O campo "Valor de Venda" para produtos fracionados esta usando `price` (preco da garrafa inteira = R$40) multiplicado pelo estoque em doses (20), resultando em R$800.

O correto e usar `promotional_price` (preco por dose = R$5), pois o estoque ja esta em doses:
- 20 doses x R$5 = **R$100** de valor de venda

### Solucao

Alterar **2 trechos** no arquivo `src/components/commerce/CommerceStockControl.tsx`:

1. **Linha 208** (calculo das estatisticas/cards): trocar `product.price` por `product.promotional_price` para fracionados
2. **Linha 737** (tabela de produtos): mesma correcao

**De:**
```typescript
const unitSale = (product.is_fractioned) ? (product.price || 0) : (product.promotional_price || 0);
```

**Para:**
```typescript
const unitSale = product.promotional_price || 0;
```

Como `promotional_price` ja contem o preco de venda por dose para fracionados e o preco de venda para produtos normais, a logica fica simplificada sem necessidade de condicional.

### Resultado esperado

| Campo | Antes | Depois |
|-------|-------|--------|
| Valor Venda (Dose Jack) | R$800,00 | R$100,00 |
| Lucro Potencial | inflado | correto |

Alteracao em 1 arquivo, 2 linhas.

