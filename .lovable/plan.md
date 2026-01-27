
# Plano de Correção de Segurança - Fase 2

## Resumo dos Erros Restantes

Após análise detalhada do banco de dados e código, identifiquei os seguintes problemas ativos:

| Nível | Problema | Status Real |
|-------|----------|-------------|
| ❌ Error | Customer Personal Data Could Be Stolen | **FALSO POSITIVO** - RLS já correta |
| ❌ Error | Business Owner Personal Information Exposed | **REQUER CORREÇÃO** - Campos sensíveis expostos |
| ❌ Error | Admin Creation Endpoint Publicly Accessible | **OUTDATED** - Já corrigido com ADMIN_SETUP_SECRET |
| ❌ Error | Admin Password Hardcoded | **OUTDATED** - Já usa environment variable |
| ❌ Error | Commerce Assets Modifiable By Any User | **OUTDATED** - Já corrigido com ownership check |
| ⚠️ Warning | Business Promotional Codes Exposed | **REQUER CORREÇÃO** |
| ⚠️ Warning | Leaked Password Protection Disabled | **REQUER CORREÇÃO** via configure-auth |
| ⚠️ Warning | Table Claiming Allows Cross-Commerce DoS | **OUTDATED** - Já existe verificação |
| ⚠️ Warning | Weak Password Requirements | **OUTDATED** - Já implementado 8 chars + complexidade |

---

## Análise Detalhada

### 1. Customer Personal Data (profiles) - FALSO POSITIVO

A política atual já está **CORRETA**:
```sql
-- Política existente (já segura):
"Users can view their own profile or admin can view all"
USING: ((auth.uid() = user_id) OR is_master_admin())
```

**Usuários só veem seu próprio perfil.** O scanner está desatualizado.

---

### 2. Business Owner Personal Information (commerces) - REQUER CORREÇÃO

**Problema real:** A tabela `commerces` expõe campos sensíveis publicamente:
- `document` (CPF/CNPJ do dono)
- `email` (email pessoal)  
- `owner_name` (nome completo)
- `phone` e `whatsapp` (contatos pessoais)

**Análise do código frontend:**

| Componente | Campos usados | Precisa expor? |
|------------|---------------|----------------|
| CommerceStorefront | fantasy_name, logo_url, cover_url, city, neighborhood, address, phone, whatsapp, is_open, delivery_enabled, opening_hours, table_payment_required | phone/whatsapp para contato |
| FeaturedStores | id, fantasy_name, city, cep, logo_url, cover_url, neighborhood, is_open, opening_hours, whatsapp, phone | Sim, para listagem |
| UserDashboard | id, fantasy_name, logo_url, cover_url, city, neighborhood, is_open, opening_hours, whatsapp | Sim |

**Solução:** Criar uma **view pública** que exponha apenas campos seguros, e restringir SELECT direto na tabela `commerces`.

---

### 3. Business Promotional Codes (commerce_coupons) - REQUER CORREÇÃO

**Problema:** Qualquer pessoa (mesmo anônimo) pode ver todos os cupons ativos de qualquer comércio.

**Solução:** Restringir para usuários autenticados apenas, sem expor códigos em listagem pública.

---

### 4. Leaked Password Protection - REQUER CONFIGURAÇÃO

O linter do Supabase continua indicando que está desabilitado. Vou tentar habilitar via configure-auth novamente.

---

## Mudanças Planejadas

### 1. Criar View Pública para Commerces

Uma view que expõe apenas dados seguros para vitrine pública:

```sql
CREATE VIEW public.commerces_public
WITH (security_invoker=on) AS
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
  phone,           -- Para contato (necessário para delivery)
  whatsapp,        -- Para contato WhatsApp
  is_open,
  opening_hours,
  delivery_enabled,
  table_payment_required,
  status
FROM public.commerces
WHERE status = 'approved';
-- Exclui: document, document_type, email, owner_name, owner_id,
--         rejection_reason, plan_id, requested_plan_id, etc.
```

### 2. Atualizar RLS de commerces

```sql
-- Restringir SELECT direto na tabela base
DROP POLICY IF EXISTS "Public can view approved commerces" ON public.commerces;

-- Donos e admins podem ver todos os dados
CREATE POLICY "Owners and admins can view commerces"
ON public.commerces FOR SELECT
USING (
  (owner_id = auth.uid()) 
  OR is_master_admin()
);

-- Visitantes usam a view commerces_public
```

### 3. Atualizar Código Frontend

Alterar os componentes para usar a view `commerces_public` em vez da tabela direta:

- `src/components/landing/FeaturedStores.tsx`
- `src/pages/user/UserDashboard.tsx`
- `src/components/user/CommerceStorefront.tsx`

### 4. Restringir commerce_coupons

```sql
DROP POLICY IF EXISTS "Anyone can view active coupons for ordering" ON public.commerce_coupons;

CREATE POLICY "Authenticated users can view active coupons"
ON public.commerce_coupons FOR SELECT
TO authenticated
USING (is_active = true);
```

### 5. Atualizar Findings do Scanner

Marcar findings outdated como resolvidos.

---

## Impacto nas Funcionalidades

| Funcionalidade | Impacto |
|----------------|---------|
| Landing page/vitrine | Nenhum - usa view com mesmos campos necessários |
| Busca de lojas | Nenhum - view expõe todos campos de listagem |
| Contato WhatsApp | Nenhum - phone/whatsapp incluídos na view |
| Admin/Dono | Nenhum - acesso total via RLS |
| Cupons | Apenas usuários logados podem aplicar (já era o fluxo) |

---

## Ordem de Execução

1. Criar view `commerces_public` via migration
2. Atualizar política RLS de `commerces`
3. Restringir `commerce_coupons` para authenticated
4. Atualizar queries no frontend para usar view
5. Configurar leaked password protection
6. Marcar findings outdated como resolvidos

---

## Seção Técnica

### Migration SQL

```sql
-- 1. Criar view pública para commerces (sem dados sensíveis)
CREATE OR REPLACE VIEW public.commerces_public
WITH (security_invoker=on) AS
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

-- 2. Atualizar política de SELECT em commerces
-- Remover política pública
DROP POLICY IF EXISTS "Public can view approved commerces" ON public.commerces;

-- Criar política restrita para donos/admin
CREATE POLICY "Owners and admins can view full commerce data"
ON public.commerces FOR SELECT
USING (
  (owner_id = auth.uid()) 
  OR is_master_admin()
);

-- 3. Restringir cupons para autenticados
DROP POLICY IF EXISTS "Anyone can view active coupons for ordering" ON public.commerce_coupons;

CREATE POLICY "Authenticated users can view active coupons"
ON public.commerce_coupons FOR SELECT
TO authenticated
USING (is_active = true);

-- 4. Permitir SELECT na view para role public/anon
GRANT SELECT ON public.commerces_public TO anon;
GRANT SELECT ON public.commerces_public TO authenticated;
```

### Arquivos Frontend a Atualizar

| Arquivo | Mudança |
|---------|---------|
| `src/components/landing/FeaturedStores.tsx` | `.from('commerces')` → `.from('commerces_public')` |
| `src/pages/user/UserDashboard.tsx` | `.from('commerces')` → `.from('commerces_public')` |
| `src/components/user/CommerceStorefront.tsx` | Condicional: usar view para vitrine, tabela para dono |
| `src/pages/Ranking.tsx` | `.from('commerces')` → `.from('commerces_public')` |

### Tipos TypeScript

Atualizar `src/integrations/supabase/types.ts` será automático após migration.
