
# Plano de Implementação: Sincronização de Planos, Notificações de Upgrade e Cupons no Checkout

## Resumo das Solicitações

Baseado nas 7 imagens anexadas, identifiquei 4 problemas principais a resolver:

1. **Sincronizar funcionalidades dos planos** - As opções ativadas/desativadas no Master Admin (allowed_menu_items) devem aparecer como features nos cards de plano no cadastro e no modal de upgrade
2. **Notificação de upgrade não chega** - A solicitação de upgrade é salva, mas a notificação para o Master Admin falha silenciosamente
3. **Indicador visual de upgrade pendente** - Falta um contador/badge no menu "Adegas/Tabacarias" e nos cards dos comércios
4. **Campo de cupom no checkout** - Adicionar campo para cupons do comércio nos modais de delivery/mesa, com integração no PDV e financeiro

---

## Parte 1: Sincronizar Features dos Planos com allowed_menu_items

### Problema Atual
Os planos possuem duas colunas separadas:
- `features` - Lista de textos descritivos (hardcoded)
- `allowed_menu_items` - IDs das funcionalidades ativas

No cadastro e modal de upgrade, o sistema exibe a coluna `features` estática, ignorando o que o Master Admin configura em `allowed_menu_items`.

### Solução
Criar uma função utilitária que converte `allowed_menu_items` em labels legíveis para exibição.

### Arquivos a Modificar

1. **`src/components/auth/AuthModal.tsx`**
   - Criar mapeamento de ID → label amigável
   - Modificar a exibição dos cards de plano para usar `allowed_menu_items` 
   - Adicionar query para buscar `allowed_menu_items` junto com os planos
   - Filtrar apenas itens não-obrigatórios (excluir overview e settings)

2. **`src/components/commerce/UpgradeModal.tsx`**
   - Mesma lógica: substituir `features` por labels derivados de `allowed_menu_items`
   - Buscar `allowed_menu_items` na query de planos

### Mapeamento de IDs para Labels
```text
cashregister → Caixa/PDV
orders → Gestão Pedidos
delivery → Delivery
deliveryzones → Áreas de Entrega
tables → Mesas/Comandas
products → Produtos
categories → Categorias
stockcontrol → Controle Estoque
financial → Financeiro
coupons → Cupons
customers → Clientes
photos → Fotos
ranking → Ranking
```

---

## Parte 2: Corrigir Notificação de Upgrade

### Problema Atual
A política RLS da tabela `admin_notifications` permite apenas `master_admin`:
```sql
POLICY "Master admin can manage notifications"
ON admin_notifications FOR ALL
USING (is_master_admin())
```

Quando um **commerce** tenta inserir uma notificação, a operação falha silenciosamente devido ao RLS.

### Solução
Criar uma política adicional que permite `INSERT` para usuários autenticados:

### Migração SQL
```sql
-- Permitir que qualquer usuário autenticado insira notificações
CREATE POLICY "Authenticated users can insert notifications"
ON public.admin_notifications
FOR INSERT
TO authenticated
WITH CHECK (true);
```

### Alternativa (mais segura)
Criar uma função `SECURITY DEFINER` que encapsula a criação de notificações, permitindo que commerce users criem notificações sem acesso direto à tabela.

---

## Parte 3: Indicador Visual de Solicitações de Upgrade

### Problema Atual
Não há feedback visual no painel do Master Admin quando há solicitações de upgrade pendentes.

### Solução

1. **Contador no Menu "Adegas/Tabacarias"**
   - Adicionar badge com número de solicitações pendentes no menu lateral

2. **Badge nos Cards de Comércio**
   - Exibir indicador visual nos cards de comércios que têm `upgrade_request_status = 'pending'`

3. **Ícone de upgrade no sino de notificações**
   - Adicionar ícone específico para tipo `upgrade_request`

### Arquivos a Modificar

1. **`src/pages/admin/AdminDashboard.tsx`**
   - Buscar contagem de `upgrade_request_status = 'pending'`
   - Exibir badge no item "Adegas/Tabacarias" do menu

2. **`src/components/admin/AdminCommerces.tsx`**
   - Adicionar badge "Upgrade Pendente" nos cards de comércios com solicitação

3. **`src/components/admin/AdminNotificationBell.tsx`**
   - Adicionar ícone específico para `upgrade_request`
   - Usar ícone `ArrowUp` para distinguir de outros tipos

---

## Parte 4: Campo de Cupom no Checkout

### Problema Atual
O checkout de delivery/mesa não possui campo para aplicar cupons criados pelo comércio (tabela `commerce_coupons`).

### Alterações no Banco de Dados

Adicionar colunas na tabela `orders`:
```sql
ALTER TABLE orders 
ADD COLUMN coupon_code text,
ADD COLUMN coupon_discount numeric DEFAULT 0;
```

### Arquivos a Modificar

1. **`src/components/user/CommerceStorefront.tsx`**
   - Adicionar estados para cupom: `couponCode`, `couponValid`, `couponDiscount`
   - Adicionar campo de input no modal de carrinho (antes do resumo)
   - Validar cupom contra tabela `commerce_coupons` do comércio específico
   - Calcular desconto e atualizar total
   - Salvar `coupon_code` e `coupon_discount` ao criar pedido

2. **`src/components/commerce/CommerceCashRegister.tsx`**
   - Exibir `coupon_code` e `coupon_discount` nos detalhes do pedido no PDV

3. **`src/components/commerce/CommerceFinancial.tsx`**
   - Incluir descontos de cupom nos cálculos financeiros

### Fluxo de Validação do Cupom
1. Cliente digita código do cupom
2. Sistema busca em `commerce_coupons` WHERE `commerce_id` = comércio atual AND `code` = cupom digitado
3. Valida: ativo, datas, limite de uso, valor mínimo do pedido
4. Calcula desconto (percentual ou fixo)
5. Aplica limite máximo se houver
6. Atualiza total exibido

---

## Resumo das Tarefas

| # | Tarefa | Arquivos | Prioridade |
|---|--------|----------|------------|
| 1 | Migração SQL: política RLS para INSERT em admin_notifications | migration | Alta |
| 2 | Migração SQL: colunas coupon_code/discount em orders | migration | Alta |
| 3 | Sincronizar features com allowed_menu_items no AuthModal | AuthModal.tsx | Média |
| 4 | Sincronizar features com allowed_menu_items no UpgradeModal | UpgradeModal.tsx | Média |
| 5 | Contador de upgrades no menu lateral | AdminDashboard.tsx | Alta |
| 6 | Badge de upgrade nos cards de comércio | AdminCommerces.tsx | Média |
| 7 | Ícone de upgrade no sino de notificações | AdminNotificationBell.tsx | Baixa |
| 8 | Campo de cupom no checkout delivery/mesa | CommerceStorefront.tsx | Alta |
| 9 | Exibir cupom nos detalhes do PDV | CommerceCashRegister.tsx | Média |
| 10 | Incluir cupom nos relatórios financeiros | CommerceFinancial.tsx | Média |

---

## Detalhes Técnicos

### Mapeamento menuItemsConfig (compartilhado)
Criar arquivo utilitário em `src/lib/planFeatures.ts`:
```typescript
export const menuItemLabels: Record<string, string> = {
  cashregister: "Caixa/PDV",
  orders: "Gestão Pedidos",
  delivery: "Delivery",
  deliveryzones: "Áreas de Entrega",
  tables: "Mesas/Comandas",
  products: "Produtos",
  categories: "Categorias",
  stockcontrol: "Controle Estoque",
  financial: "Financeiro",
  coupons: "Cupons",
  customers: "Clientes",
  photos: "Fotos",
  ranking: "Ranking",
};

export const getFeatureLabels = (allowedItems: string[]): string[] => {
  const excluded = ['overview', 'settings', 'paymentconfig', 'contract', 'training'];
  return allowedItems
    .filter(item => !excluded.includes(item))
    .map(item => menuItemLabels[item])
    .filter(Boolean);
};
```

### Validação de Cupom do Comércio
```typescript
const validateCommerceCoupon = async (code: string, commerceId: string, subtotal: number) => {
  const { data: coupon } = await supabase
    .from('commerce_coupons')
    .select('*')
    .eq('commerce_id', commerceId)
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .maybeSingle();
    
  if (!coupon) return { valid: false };
  
  // Validar datas, limite de usos, valor mínimo
  // Calcular desconto
  // Retornar { valid: true, discount: number, type: string }
};
```
