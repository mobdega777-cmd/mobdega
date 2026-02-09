

# Plano de Correções - Caixa/PDV

## 1. Indicar produtos esgotados no "Lançar em Comanda"

**Problema:** Ao buscar um produto no modal "Lançar em Comanda", produtos com estoque zerado aparecem normalmente, sem indicar que estao esgotados.

**Solucao:** No componente `AddToTabModal.tsx`, na lista de resultados da busca de produtos (linhas 553-572), adicionar:
- Badge "Esgotado" em vermelho ao lado do preco quando `product.stock === 0`
- Desabilitar o clique (nao permitir selecionar produto esgotado)
- Estilizar o item com opacidade reduzida para indicar visualmente a indisponibilidade
- Tambem exibir o estoque disponivel para produtos com estoque baixo

**Arquivo:** `src/components/commerce/AddToTabModal.tsx`

---

## 2. Corrigir valor total da mesa com cupom de desconto

**Problema:** O total da mesa esta sendo calculado incorretamente. O campo `order.total` no banco ja inclui o desconto do cupom (ex: Ricardo tem total=R$7.50 ao inves de R$15), porem o codigo subtrai o cupom novamente na linha 444.

**Dados confirmados no banco:**
- Vitoria: 2 pedidos com total=15+16 = R$31 (sem cupom)
- Ricardo: 1 pedido com total=R$7.50 (cupom ja aplicado, subtotal era R$15)
- Soma correta: R$38.50
- Valor exibido: R$31 (desconto subtraido duas vezes)

**Solucao:** No componente `CommerceCashRegister.tsx`, remover as linhas 440-445 que fazem a dupla deducao do cupom. O `order.total` vindo do banco ja tem o desconto aplicado, entao o acumulo via soma dos totais ja gera o valor correto.

**Arquivo:** `src/components/commerce/CommerceCashRegister.tsx`

---

## 3. Separar itens por usuario no modal "Ver Detalhes"

**Problema:** O modal "Ver Detalhes" (Comanda - Mesa X) exibe todos os itens da mesa juntos, sem separar por participante, dificultando a leitura.

**Solucao:** No modal de detalhes (linhas 2073-2161 do `CommerceCashRegister.tsx`), quando a mesa tiver comanda separada (`participantOrders` disponivel):
- Exibir uma secao para cada participante com nome e badge (Host/Participante)
- Listar os itens de cada participante agrupados
- Mostrar subtotal individual de cada participante
- Manter a exibicao do cupom por participante quando aplicavel
- Manter o total geral da mesa no final

Para comanda unica, manter o comportamento atual (todos os itens juntos com o nome do cliente no topo).

**Arquivo:** `src/components/commerce/CommerceCashRegister.tsx`

---

## Resumo Tecnico

| Correcao | Arquivo | Tipo |
|---|---|---|
| Estoque esgotado na busca | `AddToTabModal.tsx` | UI + logica |
| Total mesa com cupom | `CommerceCashRegister.tsx` linhas 440-445 | Bug de calculo |
| Ver Detalhes por participante | `CommerceCashRegister.tsx` linhas 2110-2125 | UI |

Nenhuma mudanca de layout ou estrutura existente sera alterada. Apenas as 3 correcoes solicitadas.

