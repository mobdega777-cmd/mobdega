

## Plano: Sistema de Comandas Separadas para Mesas

### Visão Geral da Solução

O fluxo será modificado para permitir que múltiplos usuários façam pedidos na mesma mesa, com a opção de comandas separadas (cada pessoa tem sua conta) ou comanda única (todos pagam junto).

---

### 1. Alterações no Banco de Dados

**Modificar tabela `tables`:**
- Adicionar coluna `bill_mode` (ENUM: `single` | `split`) - Define se a mesa é comanda única ou separada
- Adicionar coluna `session_id` (UUID) - Identificador único da sessão da mesa (muda quando a mesa é reaberta)

**Criar tabela `table_sessions`:**
```sql
CREATE TABLE table_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES tables(id),
  commerce_id UUID REFERENCES commerces(id),
  bill_mode TEXT DEFAULT 'single' CHECK (bill_mode IN ('single', 'split')),
  opened_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  opened_by_user_id UUID,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed'))
);
```

**Criar tabela `table_participants`:**
```sql
CREATE TABLE table_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES table_sessions(id),
  user_id UUID NOT NULL,
  customer_name TEXT,
  joined_at TIMESTAMPTZ DEFAULT now(),
  is_host BOOLEAN DEFAULT false  -- Quem abriu a mesa primeiro
);
```

**Modificar tabela `orders`:**
- Adicionar coluna `session_id` (UUID) - Link para a sessão da mesa

---

### 2. Fluxo na Vitrine do Cliente (CommerceStorefront)

#### Etapa 1: Seleção de Mesa
Quando o usuário clicar em uma mesa disponível:

**A) Se a mesa está `available` (primeiro a chegar):**
1. Exibir **popup de escolha**:
   - "Como você deseja a comanda?"
   - **Opção 1**: "Comanda Única" - Todos pagam juntos no final
   - **Opção 2**: "Comandas Separadas" - Cada pessoa paga sua conta

2. Ao escolher:
   - Criar nova `table_session` com o `bill_mode` escolhido
   - Criar registro em `table_participants` (is_host = true)
   - Atualizar mesa para `status = 'occupied'`

**B) Se a mesa está `occupied` (já tem sessão ativa):**
1. Verificar se o usuário atual já é participante da sessão
2. Se não for, exibir popup:
   - "Esta mesa já está ocupada. Deseja se juntar à sessão?"
   - Mostrar nome do host e modo (única/separada)
3. Se sim: adicionar usuário como participante em `table_participants`
4. Usuário pode fazer pedidos normalmente

---

### 3. Modificações na Aba "Comanda"

#### Para Comanda Única (`bill_mode = 'single'`):
- Exibir TODOS os itens de todos os participantes da sessão
- Total geral unificado
- Qualquer participante pode pedir a conta (mas só o caixa fecha)

#### Para Comandas Separadas (`bill_mode = 'split'`):
- Cada usuário vê APENAS seus próprios itens
- Mostrar "Sua Comanda Pessoal - Mesa X"
- Total individual
- Botão "Pedir Minha Conta" (individual)

---

### 4. Botão "Pedir Conta" na Comanda

Adicionar botão abaixo do total na aba Comanda:

```tsx
<Button 
  variant="outline" 
  className="w-full h-12 border-primary text-primary"
  onClick={handleRequestBill}
>
  <CreditCard className="w-4 h-4 mr-2" />
  Pedir Conta
</Button>
```

**Comportamento (para implementar depois):**
- Quando clicado, pode notificar o caixa que o cliente quer fechar
- Ou abrir modal de pagamento se `table_payment_required` estiver ativo

---

### 5. Ajustes no Modal de Seleção de Mesas

Modificar para mostrar mesas ocupadas como "clicáveis" (em amarelo/laranja) quando já têm sessão ativa:

- **Verde**: Mesa disponível - pode abrir nova sessão
- **Amarelo/Laranja**: Mesa ocupada mas aceita participantes - pode se juntar
- **Vermelho**: Mesa fechada/reservada - não pode acessar

---

### 6. Painel do Caixa/PDV

**Ajustes para comandas separadas:**
- Ao visualizar mesa com `bill_mode = 'split'`:
  - Mostrar lista de participantes
  - Permitir fechar conta individual de cada participante
  - Opção de "Unificar todas as contas" se necessário

---

### Arquivos a Modificar

1. **Banco de dados**: Criar migration com novas tabelas e colunas
2. **`CommerceStorefront.tsx`**: 
   - Popup de escolha de modo de comanda
   - Lógica para participar de sessão existente
   - Botão "Pedir Conta"
   - Ajuste na exibição da comanda (single vs split)
3. **`CommerceTables.tsx`**: Ajustar visualização das mesas para mostrar sessões ativas
4. **`CommerceCashRegister.tsx`**: Ajustar fechamento de conta para comandas separadas

---

### Resumo Visual do Fluxo

```
Cliente 1 chega → Mesa disponível → Popup: "Única ou Separada?"
                                         ↓
                     Escolhe "Separada" → Cria sessão com bill_mode='split'
                                         ↓
                                   Mesa fica "Ocupada"
                                         ↓
Cliente 2 chega → Mesa ocupada → Popup: "Deseja se juntar?"
                                         ↓
                            Sim → Adiciona como participante
                                         ↓
                      Cada um faz pedido → Vinculado à sessão
                                         ↓
Cliente 1 clica "Pedir Conta" → Notifica caixa (sua conta individual)
Cliente 2 continua pedindo...
```

