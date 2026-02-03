

# Plano: Sistema de Modo Funcionário/Gestão

## Resumo
Implementar um sistema de controle de acesso no painel do comércio que permite ao administrador:
1. Configurar quais itens do menu são visíveis no "Modo Funcionário"
2. Definir uma senha de gestão para alternar entre modos
3. Adicionar um toggle no sidebar para alternar entre Funcionário/Gestão

---

## Visão do Usuário

### Nova Seção em Configurações
Após a seção "Endereço", será adicionada uma nova seção chamada **"Controle de Funcionários"** com:
- Lista de checkboxes para cada item do menu (ex: Caixa/PDV, Pedidos, Delivery, etc.)
- Campo para definir a senha do modo Gestão
- Campo para confirmar a senha

### Toggle no Sidebar
- Localizado acima do botão "Sair"
- Visual de switch com texto "Funcionário" / "Gestão"
- Quando desligado (Funcionário): mostra apenas os itens permitidos
- Quando ligado (Gestão): abre modal de senha, após validação mostra todos os itens

---

## Detalhes Técnicos

### 1. Migração do Banco de Dados
Adicionar duas novas colunas na tabela `commerces`:

```sql
ALTER TABLE public.commerces 
ADD COLUMN IF NOT EXISTS employee_visible_menu_items text[] DEFAULT ARRAY['overview', 'cashregister', 'orders', 'delivery', 'tables']::text[],
ADD COLUMN IF NOT EXISTS management_password_hash text;
```

- `employee_visible_menu_items`: Array com os IDs dos itens visíveis no modo funcionário
- `management_password_hash`: Hash da senha para acessar modo Gestão (armazenada com hash simples no frontend ou validada localmente)

### 2. Atualização do CommerceSettings.tsx
Adicionar após a seção de Endereço:
- Nova seção "Controle de Funcionários"
- Grid de switches para cada item do menu
- Campos de senha (nova senha + confirmação)
- Botão para salvar configurações de funcionário separadamente

### 3. Atualização do CommerceDashboard.tsx
- Novo estado `isEmployeeMode` (boolean)
- Novo estado `employeeMenuItems` (array de strings do banco)
- Carregar `employee_visible_menu_items` junto com dados do commerce
- Adicionar toggle "Funcionário/Gestão" acima do botão Sair
- Criar modal `EmployeePasswordModal` para validar senha ao mudar para Gestão
- Filtrar `allMenuItems` baseado no modo atual

### 4. Novo Componente: EmployeeModeToggle.tsx
Componente visual do toggle com:
- Switch usando Radix UI
- Labels "Funcionário" e "Gestão"
- Ícones indicativos (User para funcionário, Shield para gestão)

### 5. Novo Modal: ManagementPasswordModal.tsx
- Input de senha
- Validação contra a senha salva
- Mensagem de erro se senha incorreta
- Botão confirmar/cancelar

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/...` | Criar migração para novas colunas |
| `src/components/commerce/CommerceSettings.tsx` | Adicionar seção de controle de funcionários |
| `src/pages/commerce/CommerceDashboard.tsx` | Adicionar toggle e lógica de filtragem |
| `src/components/commerce/ManagementPasswordModal.tsx` | Criar modal de senha |
| `src/components/commerce/SystemUpdates.tsx` | Registrar nova funcionalidade |

---

## Fluxo de Uso

```text
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN DO COMÉRCIO                        │
│                                                             │
│  1. Acessa Configurações                                    │
│  2. Rola até "Controle de Funcionários"                     │
│  3. Marca quais itens o funcionário pode ver                │
│  4. Define senha do modo Gestão                             │
│  5. Salva                                                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    FUNCIONÁRIO                              │
│                                                             │
│  1. Faz login (mesma conta do comércio)                     │
│  2. Sistema inicia em modo Funcionário                      │
│  3. Menu mostra apenas itens permitidos                     │
│  4. Para acessar Gestão, clica no toggle                    │
│  5. Insere senha → Libera menu completo                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Considerações de Segurança

- A senha de gestão será armazenada como texto simples no banco (para validação local no frontend)
- Este é um controle de conveniência, não uma barreira de segurança forte
- O funcionário tecnicamente tem acesso à mesma conta, apenas a UI é limitada
- Para segurança real, seria necessário contas separadas com RLS

---

## Valores Padrão

Itens visíveis por padrão no modo Funcionário:
- Visão Geral (`overview`)
- Caixa/PDV (`cashregister`)
- Gestão Pedidos (`orders`)
- Delivery (`delivery`)
- Mesas/Comandas (`tables`)

