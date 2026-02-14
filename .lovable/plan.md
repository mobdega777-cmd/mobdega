

## 3 Melhorias de UI no Controle de Estoque e Ranking

### 1. Paginacao nas Ultimas Vendas (Saidas de Estoque)

Atualmente a lista exibe apenas os 5 primeiros registros (`recentMovements.slice(0, 5)`). A mudanca sera:

- Remover o `slice(0, 5)` e usar paginacao com 10 itens por pagina
- Aumentar o `limit` na query de `10` para um valor maior (ex: 50) para ter mais dados disponiveis
- Adicionar estado de pagina e controles de navegacao (Anterior/Proximo) abaixo da lista
- Usar o componente `Pagination` existente do projeto

**Arquivo:** `src/components/commerce/CommerceStockControl.tsx`
- Linha 162: Aumentar `.limit(10)` para `.limit(50)`
- Linha 751: Substituir `recentMovements.slice(0, 5)` por logica de paginacao (10 por pagina)
- Adicionar estado `salesPage` e controles de paginacao no final da lista

### 2. Barra de rolagem na tabela de produtos

A tabela de produtos atualmente cresce indefinidamente. A mudanca sera:

- Envolver a `Table` em um `ScrollArea` com altura maxima definida (ex: `max-h-[500px]`)
- Importar `ScrollArea` de `@/components/ui/scroll-area`

**Arquivo:** `src/components/commerce/CommerceStockControl.tsx`
- Linha ~796-797: Envolver o bloco da `Table` com `<ScrollArea className="max-h-[500px]">`

### 3. Barra de rolagem no dropdown de regioes do Ranking

O `SelectContent` do seletor de regioes ja tem `max-h-[400px]` mas nao tem `overflow-y-auto` nem um `ScrollArea`. A mudanca sera:

- Adicionar `overflow-y-auto` ao `SelectContent` para garantir a rolagem
- O Radix Select ja suporta scroll internamente, mas pode ser necessario ajustar o estilo para funcionar corretamente com muitos grupos

**Arquivo:** `src/components/commerce/CommerceRanking.tsx`
- Linha 602: Ajustar o `SelectContent` para incluir scroll adequado, ex: `className="max-h-[300px] overflow-y-auto"`

### Detalhes tecnicos

- Nenhuma alteracao de banco de dados
- Nenhuma nova dependencia
- Componentes `ScrollArea` e `Pagination` ja existem no projeto
- O layout existente nao sera alterado, apenas adicionados controles dentro dos cards ja existentes

