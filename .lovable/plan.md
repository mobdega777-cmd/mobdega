
# Plano: Corrigir Função de Busca de Email para Login por CPF/CNPJ

## Contexto do Problema

Você perguntou: **"Por que busca email se colocamos o CNPJ ou CPF para fazer o login?"**

### Resposta Técnica

O **sistema de autenticação do Lovable Cloud** (baseado em Supabase Auth) **só aceita login com email + senha**. Não existe suporte nativo para login com CPF/CNPJ.

Para permitir que comerciantes façam login usando o documento, criamos um fluxo intermediário:

```text
┌──────────────────────────────────────────────────────────────┐
│                FLUXO DE LOGIN POR CPF/CNPJ                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   Comerciante digita:  44.072.657/0001-30 + senha           │
│                              ↓                               │
│   Sistema chama função:  get_commerce_email_by_document      │
│                              ↓                               │
│   Função retorna o email associado ao documento              │
│                              ↓                               │
│   Sistema faz login com:  email@encontrado.com + senha       │
│                              ↓                               │
│   Autenticação validada → Acesso liberado                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## O Problema Identificado

A função `get_commerce_email_by_document` atual busca o email da **tabela `commerces`**:

| Tabela     | Campo       | Valor                      |
|------------|-------------|----------------------------|
| commerces  | document    | 44072657000130             |
| commerces  | email       | ricardinhuloko@gmail.com   |
| auth.users | email       | adegapremium@gmail.com     |

Quando o email em `commerces` é diferente do email em `auth.users`, o login falha com "Invalid login credentials".

---

## Solução Proposta

Alterar a função `get_commerce_email_by_document` para buscar o email diretamente da tabela `auth.users` através do `owner_id`, garantindo que **sempre usamos o email correto de autenticação**.

### Nova Lógica:

```text
CPF/CNPJ → commerces.document → commerces.owner_id → auth.users.email
```

---

## Detalhes Técnicos

### Alteração no Banco de Dados

Atualizar a função RPC para fazer um JOIN com `auth.users`:

```sql
CREATE OR REPLACE FUNCTION public.get_commerce_email_by_document(p_document text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT au.email 
  FROM public.commerces c
  JOIN auth.users au ON au.id = c.owner_id
  WHERE REGEXP_REPLACE(c.document, '\D', '', 'g') = REGEXP_REPLACE(p_document, '\D', '', 'g')
  LIMIT 1;
$$;
```

### Por que isso é seguro?

- A função usa `SECURITY DEFINER`, executando com permissões do criador
- Retorna apenas o email, sem expor outros dados de `auth.users`
- Mantém a mesma assinatura, então o código do frontend não precisa mudar

---

## Resultado Esperado

Após a alteração:
- O login por CPF/CNPJ sempre usará o email de autenticação correto
- Mesmo que o email em `commerces` esteja desatualizado, o login funcionará
- O fluxo permanece transparente para o comerciante
