

## Plano: 3 Alteracoes - Atualizacoes do Sistema + Produto Composto/Fracionado + Transferencia de Estoque

Este plano cobre 3 solicitacoes distintas. Dado a complexidade, especialmente do item 2 (Produto Composto/Fracionado), vou detalhar cada uma.

---

### 1. Corrigir "Atualizacoes do Sistema"

**Problema:** Os triggers de banco registram acoes dos comerciantes (produtos cadastrados, categorias criadas, pedidos, etc.) como "atualizacoes do sistema". O objetivo real e mostrar apenas atualizacoes da plataforma feitas pela equipe de desenvolvimento.

**Solucao:**
- Remover os triggers automaticos das tabelas: `products`, `categories`, `orders`, `expenses`, `profiles`, `commerce_coupons`, `delivery_zones`, `payment_methods`, `tables`
- Manter apenas os triggers de tabelas administrativas que refletem mudancas da plataforma: `plans`, `commerces` (status/plano), `invoices`
- Limpar da tabela `system_updates` os registros indevidos (produtos, categorias, pedidos, despesas, etc.)
- O card "Atualizacoes do Sistema" passara a mostrar apenas mudancas reais da plataforma (novos planos, alteracao de status de comercio, faturas)
- Para atualizacoes manuais de features/menus/fluxos, o admin master podera inserir registros diretamente via painel admin (futuro)

---

### 2. Produto Composto, Fracionado e Oculto do Cardapio

Esta e a maior alteracao. Envolve mudancas no banco de dados e em varios componentes.

**Novas colunas na tabela `products`:**
- `is_composite` (boolean, default false) - Produto Composto
- `is_fractioned` (boolean, default false) - Produto Fracionado
- `hide_from_menu` (boolean, default false) - Nao Aparecer no Cardapio
- `fraction_unit` (text, nullable) - Unidade de medida (ex: "ml", "g")
- `fraction_total` (numeric, nullable) - Total da unidade (ex: 1000 para 1 litro)
- `fraction_per_serving` (numeric, nullable) - Quantidade por dose (ex: 50ml)
- `cost_per_serving` (numeric, nullable) - Custo por dose

**Nova tabela `composite_product_items`:**
- `id` (uuid, PK)
- `composite_product_id` (uuid, FK para products) - O produto composto
- `component_product_id` (uuid, FK para products) - O item componente
- `quantity` (numeric) - Quantidade usada (ex: 50 para 50ml, ou 1 para 1 unidade)
- `created_at` (timestamptz)

**Fluxo no modal "Novo Produto":**
- Tres checkboxes abaixo do nome: "Produto Composto", "Produto Fracionado", "Nao Aparecer no Cardapio"
- Ao marcar **Produto Fracionado**: abre secao com campos para configurar unidade (ml/g/un), total, quantidade por dose e custo por dose. O estoque sera registrado na unidade total (ex: 1000ml). Cada venda deduz a quantidade da dose (ex: 50ml)
- Ao marcar **Produto Composto**: abre secao com busca de produtos do estoque. O comerciante adiciona os itens componentes com suas quantidades. O custo total e calculado automaticamente somando os custos dos componentes
- Ao marcar **Nao Aparecer no Cardapio**: o produto fica invisivel na vitrine do cliente

**Impacto na deducao de estoque:**
- Para produtos compostos: ao vender, o sistema deduz o estoque de cada componente individualmente (itens unitarios: -1 unidade; itens fracionados: -quantidade configurada em ml/g)
- A funcao `apply_stock_deduction_for_order` precisara ser atualizada para verificar se o produto vendido e composto e, se sim, deduzir os componentes
- A vitrine do cliente filtrara produtos com `hide_from_menu = true`

---

### 3. Botao de Transferencia no Controle de Estoque

**O que sera feito:**
- Adicionar um terceiro botao (icone de transferencia) ao lado dos botoes + e - na tabela de estoque
- Os 3 botoes serao levemente menores para caber na coluna
- Ao clicar, abre um modal de transferencia que permite:
  - Selecionar a categoria de destino
  - Selecionar o produto de destino (dentro daquela categoria)
  - Definir a quantidade a transferir
  - O sistema recalcula: remove 1 unidade do produto origem, adiciona o equivalente no produto destino (considerando fracoes se aplicavel)
  - Exemplo: transferir 1 garrafa (1000ml) para o produto fracionado recalcula o estoque em ml, o custo e o valor

---

### Detalhes tecnicos

**Migracao SQL:**

```text
-- 1. Novas colunas em products
ALTER TABLE products ADD COLUMN is_composite boolean DEFAULT false;
ALTER TABLE products ADD COLUMN is_fractioned boolean DEFAULT false;
ALTER TABLE products ADD COLUMN hide_from_menu boolean DEFAULT false;
ALTER TABLE products ADD COLUMN fraction_unit text;
ALTER TABLE products ADD COLUMN fraction_total numeric;
ALTER TABLE products ADD COLUMN fraction_per_serving numeric;
ALTER TABLE products ADD COLUMN cost_per_serving numeric;

-- 2. Nova tabela composite_product_items
CREATE TABLE composite_product_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  composite_product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  component_product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- RLS: mesmo padrao de products (dono do comercio)

-- 3. Remover triggers indevidos
DROP TRIGGER IF EXISTS trg_system_update_products ON products;
DROP TRIGGER IF EXISTS trg_system_update_categories ON categories;
DROP TRIGGER IF EXISTS trg_system_update_orders ON orders;
DROP TRIGGER IF EXISTS trg_system_update_expenses ON expenses;
DROP TRIGGER IF EXISTS trg_system_update_profiles ON profiles;
DROP TRIGGER IF EXISTS trg_system_update_coupons ON commerce_coupons;
DROP TRIGGER IF EXISTS trg_system_update_delivery ON delivery_zones;
DROP TRIGGER IF EXISTS trg_system_update_payment ON payment_methods;
DROP TRIGGER IF EXISTS trg_system_update_tables ON tables;

-- 4. Limpar registros indevidos da system_updates
DELETE FROM system_updates WHERE module IN ('Produtos','Categorias','Pedidos','Financeiro','Cupons','Delivery','Pagamentos','Mesas/Comandas','Clientes');

-- 5. Atualizar funcao de deducao de estoque para compostos
```

**Arquivos a serem modificados/criados:**

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/commerce/CommerceProducts.tsx` | Adicionar 3 checkboxes no modal, secoes condicionais para fracionado e composto, busca de componentes |
| `src/components/commerce/CommerceStockControl.tsx` | Adicionar botao de transferencia, modal de transferencia com selecao de destino e recalculo |
| `src/components/user/CommerceStorefront.tsx` | Filtrar produtos com `hide_from_menu = true` |
| Migracao SQL | Novas colunas, tabela, remocao de triggers, limpeza de dados |
| Funcao SQL `apply_stock_deduction_for_order` | Atualizar para deduzir componentes de produtos compostos |

**Nenhuma alteracao em:** layout geral, autenticacao, RLS existente, fluxo de pedidos basico.

