
# Plano de Correção: 5 Problemas Identificados

## Resumo dos Problemas

1. **"0" aparecendo no modal de Detalhes do Pedido** - Um "0" é exibido entre Subtotal e Desconto no modal de detalhes (CommerceOrders.tsx)

2. **Avatar do autor do tópico não aparece no Fórum** - A foto aparece na área de resposta (usando `commerceLogo`), mas não no tópico criado (usando `author_avatar_url` que está `null`)

3. **Modal "Fechar Comanda Individual" mostra valor sem desconto** - Quando há cupom aplicado na mesa, o modal de fechamento mostra o valor original (R$ 60,00) e não o valor com desconto (R$ 30,00)

4. **Faturamento deve mostrar valor Líquido (com taxas descontadas)** - Os cards de Faturamento do Período devem mostrar o valor já com taxas de maquininha descontadas

5. **Lucro Estimado e outros cards também precisam refletir as taxas** - Todos os cálculos financeiros devem considerar as taxas das operadoras

---

## Detalhes Técnicos e Correções

### Problema 1: "0" no modal de Detalhes do Pedido

**Análise:**
- O modal em `CommerceOrders.tsx` (linhas 598-706) exibe detalhes do pedido
- A interface `Order` (linhas 68-86) não inclui `coupon_code` e `coupon_discount`
- Os dados existem no banco (`coupon_code: TESTE, coupon_discount: 5`)
- O "0" provavelmente é renderizado pelo campo `coupon_discount` sendo acessado como propriedade "any" sem verificação adequada

**Correção:**
- Adicionar `coupon_code?: string | null` e `coupon_discount?: number | null` à interface Order
- Verificar se há renderização indevida do coupon_discount no modal
- Se o "0" é um campo sendo exibido incorretamente, adicionar verificação condicional

**Arquivos:**
- `src/components/commerce/CommerceOrders.tsx`

---

### Problema 2: Avatar do autor do tópico no Fórum

**Análise:**
- Na view de detalhes do tópico (CommerceForum.tsx, linha 276-281), usa `selectedTopic.author_avatar_url`
- Na área de resposta (linha 371-375), usa `commerceLogo` (logo da loja)
- Dados do banco: O `author_avatar_url` está `null` para o usuário "João Silva" porque ele não tem avatar cadastrado
- A loja "Adega Premium" tem logo cadastrada

**Correção:**
- Quando o autor do tópico for um comércio (`author_type === 'commerce'`), buscar o logo do comércio em vez do avatar do perfil
- Ao criar tópico, se o usuário for um comércio, usar `commerceLogo` como `author_avatar_url`
- Modificar `handleCreateTopic` para salvar o logo do comércio quando disponível

**Arquivos:**
- `src/components/commerce/CommerceForum.tsx`

---

### Problema 3: Modal "Fechar Comanda Individual" mostra valor sem desconto

**Análise:**
- O modal (CommerceCashRegister.tsx, linhas 2196-2300) mostra `selectedParticipant.total`
- O cálculo de `participantTotal` (linha 420) soma apenas os `total_price` dos itens
- Não considera o `coupon_discount` da mesa
- Na imagem: Total mesa R$ 30,00 (com desconto), mas modal individual mostra R$ 60,00

**Correção:**
Considerando a preferência do usuário de que o desconto do cupom seja aplicado apenas ao Host/solicitante:
- Identificar se o participante é o host ou solicitante
- Se for, aplicar o desconto proporcionalmente (ou totalmente ao host)
- Modificar o cálculo de `participantTotal` para considerar o desconto

**Arquivos:**
- `src/components/commerce/CommerceCashRegister.tsx`

---

### Problema 4 e 5: Faturamento Líquido (com taxas)

**Análise:**
- Atualmente o card "Faturamento do Período" mostra R$ 16,00 (bruto)
- A venda foi R$ 16,00 no Débito, que deveria ter taxa descontada
- O usuário confirmou que quer ver o valor Líquido (após taxas)
- As taxas já são calculadas em `calculatedFees` (CommerceFinancial.tsx, linha 204-210)

**Correção:**
- Modificar o card de "Faturamento do Período" para mostrar `monthlyRevenue - calculatedFees`
- Alterar o label ou adicionar tooltip explicando que é o valor líquido
- Revisar se "Lucro Estimado" também precisa ajuste (margem 40% sobre bruto ou líquido)
- Garantir que Visão Geral (CommerceOverview.tsx) também aplique as taxas

**Arquivos:**
- `src/components/commerce/CommerceFinancial.tsx`
- `src/components/commerce/CommerceOverview.tsx`

---

## Resumo das Alterações por Arquivo

| Arquivo | Alterações |
|---------|-----------|
| `CommerceOrders.tsx` | Adicionar campos cupom à interface, corrigir renderização do "0" |
| `CommerceForum.tsx` | Usar commerceLogo quando author_type é commerce, salvar logo ao criar tópico |
| `CommerceCashRegister.tsx` | Aplicar desconto de cupom ao host/solicitante no fechamento individual |
| `CommerceFinancial.tsx` | Alterar cards para exibir valor Líquido (bruto - taxas) |
| `CommerceOverview.tsx` | Sincronizar lógica de faturamento líquido |

---

## Ordem de Implementação

1. **CommerceOrders.tsx** - Corrigir o "0" (mais simples)
2. **CommerceForum.tsx** - Corrigir avatar do autor
3. **CommerceCashRegister.tsx** - Aplicar desconto ao fechar comanda individual
4. **CommerceFinancial.tsx** e **CommerceOverview.tsx** - Implementar faturamento líquido
