

# Plano de Correção - Vitrine e Login de Comércio

## Diagnóstico Completo

Identifiquei **3 problemas** causados pelas correções de segurança anteriores:

| Problema | Causa | Impacto |
|----------|-------|---------|
| Vitrine vazia | View usa `security_invoker=on`, herda RLS restritivo | Visitantes não veem comércios |
| Login falha | RLS bloqueia busca de documento | Comerciantes não conseguem logar |
| Erro no banco | Política recursiva em `table_participants` | Funcionalidades de mesas quebradas |

---

## O Que Será Corrigido

### 1. View `commerces_public` 
Recriar a view **sem** `security_invoker`, usando comportamento padrão que permite leitura dos campos públicos selecionados.

### 2. Login por CPF/CNPJ
Criar função segura `get_commerce_email_by_document()` que:
- Recebe o documento (CPF/CNPJ)
- Retorna apenas o email (sem expor outros dados)
- Usa `SECURITY DEFINER` para bypass do RLS

### 3. Política de `table_participants`
Corrigir a recursão infinita usando subquery segura.

---

## Mudanças Detalhadas

### Banco de Dados

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    MIGRATIONS A CRIAR                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. DROP e RECRIA view commerces_public (sem security_invoker)      │
│                                                                      │
│  2. CRIAR função RPC get_commerce_email_by_document()               │
│     - Input: document (text)                                         │
│     - Output: email (text) ou NULL                                   │
│     - SECURITY DEFINER para bypass RLS                              │
│                                                                      │
│  3. CORRIGIR política de table_participants                          │
│     - Usar subquery que não causa recursão                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Código Frontend

| Arquivo | Mudança |
|---------|---------|
| `AuthModal.tsx` | Usar `supabase.rpc('get_commerce_email_by_document')` em vez de query direta |

---

## Impacto nas Funcionalidades

| Funcionalidade | Status Atual | Após Correção |
|----------------|--------------|---------------|
| Vitrine (landing page) | ❌ Não mostra comércios | ✅ Mostra todos aprovados |
| Login por documento | ❌ "Comércio não encontrado" | ✅ Funciona normalmente |
| Mesas compartilhadas | ❌ Erro de recursão | ✅ Funciona normalmente |
| Segurança PII | ✅ Protegido | ✅ Mantém proteção |

---

## Segurança Mantida

Essas correções **NÃO** comprometem a segurança porque:

1. **View pública** expõe apenas campos seguros (nome fantasia, logo, telefone comercial, endereço) - sem CPF/CNPJ, email pessoal, ou dados do dono

2. **Função de login** retorna apenas o email necessário para autenticação - não expõe documento, nome do dono, ou outros dados

3. **Dados sensíveis** continuam protegidos na tabela base `commerces`

---

## Ordem de Execução

1. Aplicar migration SQL com as 3 correções
2. Atualizar `AuthModal.tsx` para usar a nova função RPC
3. Testar vitrine e login

---

## Seção Técnica

### Migration SQL

```sql
-- 1. Recriar view sem security_invoker (permite acesso público aos campos selecionados)
DROP VIEW IF EXISTS public.commerces_public;

CREATE VIEW public.commerces_public AS
SELECT 
  id,
  fantasy_name,
  logo_url,
  cover_url,
  city,
  neighborhood,
  address,
  address_number,
  cep,
  phone,
  whatsapp,
  is_open,
  opening_hours,
  delivery_enabled,
  table_payment_required,
  status,
  created_at
FROM public.commerces
WHERE status = 'approved';

-- Permitir acesso à view
GRANT SELECT ON public.commerces_public TO anon;
GRANT SELECT ON public.commerces_public TO authenticated;

-- 2. Criar função segura para lookup de email por documento (para login)
CREATE OR REPLACE FUNCTION public.get_commerce_email_by_document(p_document text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email 
  FROM public.commerces 
  WHERE REGEXP_REPLACE(document, '\D', '', 'g') = REGEXP_REPLACE(p_document, '\D', '', 'g')
  LIMIT 1;
$$;

-- Permitir chamada da função
GRANT EXECUTE ON FUNCTION public.get_commerce_email_by_document(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_commerce_email_by_document(text) TO authenticated;

-- 3. Corrigir política recursiva de table_participants
DROP POLICY IF EXISTS "Participants and commerce owners can view table participants" ON public.table_participants;

CREATE POLICY "Participants and commerce owners can view table participants"
ON public.table_participants FOR SELECT
USING (
  -- User is a participant in this session (check by user_id directly, not subquery on same table)
  user_id = auth.uid()
  OR
  -- User is commerce owner via session
  EXISTS (
    SELECT 1 FROM public.table_sessions ts
    WHERE ts.id = table_participants.session_id
    AND is_commerce_owner_or_admin(ts.commerce_id)
  )
  OR is_master_admin()
);
```

### AuthModal.tsx - Login Atualizado

```typescript
// Trocar isso:
const { data: allCommerces } = await supabase
  .from('commerces')
  .select('email, document');

commerce = allCommerces?.find(c => 
  c.document?.replace(/\D/g, '') === cleanInput
) || null;

// Por isso:
const { data: email } = await supabase
  .rpc('get_commerce_email_by_document', { p_document: cleanInput });

if (email) {
  emailToUse = email;
} else {
  // Comércio não encontrado...
}
```

