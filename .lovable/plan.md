
# Plano de Correção de Segurança

## Resumo dos Erros Identificados

O scan de segurança identificou **6 erros críticos** e **6 avisos**. Vou detalhar cada um e a solução proposta:

---

## ERROS CRÍTICOS

### 1. ❌ Admin Creation Endpoint Publicly Accessible (CORRIGIDO - Outdated)
**Status:** Já corrigido anteriormente.  
A edge function `create-admin-user` já valida o header `Authorization` com `ADMIN_SETUP_SECRET` e usa `ADMIN_DEFAULT_PASSWORD` via environment variable (não hardcoded).

**Ação:** Nenhuma - apenas atualizar o scan para remover este finding.

---

### 2. ❌ Admin Password Hardcoded in Source Code (CORRIGIDO - Outdated)
**Status:** Já corrigido anteriormente.  
O código atual usa `Deno.env.get("ADMIN_DEFAULT_PASSWORD")`.

**Ação:** Nenhuma - apenas atualizar o scan para remover este finding.

---

### 3. ❌ Commerce Assets Modifiable By Any User
**Problema:** Existem **duas políticas conflitantes** no storage:
- `Users can update/delete their own commerce assets` - verifica apenas `bucket_id` (PERMISSIVO)
- `Only owners can update/delete commerce assets` - verifica ownership (RESTRITIVO)

A política permissiva anula a restritiva, permitindo que qualquer usuário autenticado modifique arquivos de outros.

**Solução:** Remover as políticas antigas permissivas, mantendo apenas as restritivas que verificam ownership por commerce_id.

---

### 4. ❌ Customer Personal Data Could Be Stolen by Hackers
**Problema:** A política `Commerce owners can view customer profiles` permite que donos de comércio vejam dados pessoais (email, telefone, CPF, endereço) de qualquer cliente que já fez pedido.

**Solução:** Remover esta política. Comerciantes devem ver apenas os dados necessários para entrega (nome, telefone, endereço) diretamente da tabela `orders`, não do perfil completo.

---

### 5. ❌ Payment Keys and Banking Information Publicly Accessible
**Problema:** A política `Anyone can view active payment methods` expõe chaves PIX, tipos de chave e QR codes publicamente.

**Análise do código:** O `CommerceStorefront.tsx` busca `pix_key` e `pix_qr_code_url` para exibir na finalização do pedido - isso é NECESSÁRIO para o fluxo de pagamento.

**Solução:** Manter a política, mas restringir para usuários autenticados que estão fazendo pedido. Alternativamente, criar uma view que exponha apenas dados necessários para checkout, sem revelar chaves completas a visitantes anônimos.

---

### 6. ❌ Master Banking Configuration Could Leak if Policy Fails
**Problema:** A tabela `billing_config` depende apenas de `is_master_admin()`. Se a função falhar, os dados ficam expostos.

**Solução:** Adicionar política de "deny by default" como camada extra de segurança.

---

## AVISOS (Warnings)

### 7. ⚠️ Restaurant Customer Names Visible to Everyone
**Problema:** `table_participants` é público com `Anyone can view table participants`.

**Análise:** Necessário para o fluxo de mesas compartilhadas - participantes precisam ver quem está na mesa.

**Solução:** Restringir SELECT apenas para participantes da sessão e donos do comércio.

---

### 8. ⚠️ Competitor Intelligence via Table Sessions
**Problema:** `table_sessions` é público.

**Solução:** Restringir SELECT para participantes e donos do comércio.

---

### 9. ⚠️ Leaked Password Protection Disabled
**Problema:** Proteção de senhas vazadas desabilitada no Supabase Auth.

**Solução:** Habilitar via configuração de autenticação.

---

### 10. ⚠️ Weak Password Requirements
**Problema:** Senha mínima de 6 caracteres em `AdminSettings.tsx`.

**Solução:** O sistema já implementa validação de complexidade em `AuthModal.tsx` (8 chars, maiúscula, minúscula, número). Alinhar `AdminSettings.tsx` com o mesmo padrão.

---

## Mudanças no Banco de Dados

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    MIGRATIONS A CRIAR                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. STORAGE - Remover políticas conflitantes:                       │
│     DROP POLICY "Users can update their own commerce assets"        │
│     DROP POLICY "Users can delete their own commerce assets"        │
│                                                                      │
│  2. PROFILES - Remover acesso de commerce owners:                   │
│     DROP POLICY "Commerce owners can view customer profiles"        │
│                                                                      │
│  3. PAYMENT_METHODS - Restringir a autenticados:                    │
│     DROP POLICY "Anyone can view active payment methods"            │
│     CREATE POLICY - Authenticated users viewing active methods      │
│                                                                      │
│  4. TABLE_PARTICIPANTS - Restringir visibilidade:                   │
│     DROP POLICY "Anyone can view table participants"                │
│     CREATE POLICY - Session participants OR commerce owner          │
│                                                                      │
│  5. TABLE_SESSIONS - Restringir visibilidade:                       │
│     DROP POLICY "Anyone can view table sessions for a commerce"     │
│     CREATE POLICY - Session participants OR commerce owner          │
│                                                                      │
│  6. BILLING_CONFIG - Defense in depth:                              │
│     CREATE POLICY - Deny all for anon role                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Mudanças no Código Frontend

### AdminSettings.tsx
- Atualizar validação de senha para 8 caracteres mínimo + complexidade (maiúscula, minúscula, número)

### CommerceStorefront.tsx  
- Nenhuma mudança necessária - a busca de payment_methods já é autenticada pelo contexto do usuário logado

---

## Configurações de Autenticação

- Habilitar "Leaked Password Protection" no Supabase Auth via configure-auth tool

---

## Impacto nas Funcionalidades Existentes

| Funcionalidade | Impacto | Mitigação |
|----------------|---------|-----------|
| Upload de fotos/produtos | Nenhum | Já usa commerce_id na pasta |
| Checkout com PIX | Nenhum | Usuário está autenticado |
| Mesas compartilhadas | Nenhum | Participantes têm acesso via session |
| Perfil de cliente | Nenhum | Dados de entrega vêm do pedido |
| Admin master | Nenhum | Mantém acesso total |

---

## Ordem de Execução

1. **Criar migration SQL** com todas as correções de RLS
2. **Atualizar AdminSettings.tsx** com validação de senha forte
3. **Habilitar Leaked Password Protection** via configure-auth
4. **Marcar findings antigos como resolvidos** no security scanner

---

## Seção Técnica

### SQL Migration Detalhada

```sql
-- 1. STORAGE: Remover políticas permissivas conflitantes
DROP POLICY IF EXISTS "Users can update their own commerce assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own commerce assets" ON storage.objects;

-- 2. PROFILES: Remover acesso de commerce owners
DROP POLICY IF EXISTS "Commerce owners can view customer profiles" ON public.profiles;

-- 3. PAYMENT_METHODS: Restringir para autenticados
DROP POLICY IF EXISTS "Anyone can view active payment methods" ON public.payment_methods;

CREATE POLICY "Authenticated users can view active payment methods"
ON public.payment_methods FOR SELECT
TO authenticated
USING ((is_active = true) OR is_commerce_owner_or_admin(commerce_id));

-- 4. TABLE_PARTICIPANTS: Restringir para participantes e donos
DROP POLICY IF EXISTS "Anyone can view table participants" ON public.table_participants;

CREATE POLICY "Participants and commerce owners can view table participants"
ON public.table_participants FOR SELECT
USING (
  -- User is a participant in this session
  EXISTS (
    SELECT 1 FROM public.table_participants tp2
    WHERE tp2.session_id = table_participants.session_id
    AND tp2.user_id = auth.uid()
  )
  OR
  -- User is commerce owner
  EXISTS (
    SELECT 1 FROM public.table_sessions ts
    WHERE ts.id = table_participants.session_id
    AND is_commerce_owner_or_admin(ts.commerce_id)
  )
  OR is_master_admin()
);

-- 5. TABLE_SESSIONS: Restringir para participantes e donos
DROP POLICY IF EXISTS "Anyone can view table sessions for a commerce" ON public.table_sessions;

CREATE POLICY "Participants and commerce owners can view table sessions"
ON public.table_sessions FOR SELECT
USING (
  -- User is a participant in this session
  EXISTS (
    SELECT 1 FROM public.table_participants tp
    WHERE tp.session_id = table_sessions.id
    AND tp.user_id = auth.uid()
  )
  OR is_commerce_owner_or_admin(commerce_id)
  OR is_master_admin()
);

-- 6. BILLING_CONFIG: Defense in depth - deny anon
CREATE POLICY "Deny anonymous access to billing config"
ON public.billing_config FOR ALL
TO anon
USING (false);
```

### AdminSettings.tsx - Validação de Senha

```typescript
const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return 'A senha deve ter pelo menos 8 caracteres';
  }
  if (!/[A-Z]/.test(password)) {
    return 'A senha deve conter pelo menos uma letra maiúscula';
  }
  if (!/[a-z]/.test(password)) {
    return 'A senha deve conter pelo menos uma letra minúscula';
  }
  if (!/[0-9]/.test(password)) {
    return 'A senha deve conter pelo menos um número';
  }
  return null;
};
```
