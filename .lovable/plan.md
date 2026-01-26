

# Plano de Implementação - Fase de Secrets

## Objetivo
Iniciar a correção dos 5 erros de segurança, começando pela configuração dos secrets necessários.

## Passo 1: Adicionar Secrets

Ao aprovar este plano, você verá a interface para adicionar dois secrets:

### Secret 1: ADMIN_SETUP_SECRET
- **Propósito**: Token de autorização para a edge function de criação de admin
- **Valor sugerido**: Uma string aleatória forte (ex: `Mobdega@2024SecretKey#Admin`)
- **Uso**: Será exigido no header Authorization quando chamar a função

### Secret 2: ADMIN_DEFAULT_PASSWORD  
- **Propósito**: Senha do admin (removida do código fonte)
- **Valor sugerido**: Usar a senha atual `623501Ab.` ou criar uma nova mais forte
- **Uso**: Será usada pela edge function ao criar novos admins

## Passo 2: Atualizar Edge Function

Após adicionar os secrets, atualizarei a edge function `create-admin-user/index.ts` para:
1. Validar o `ADMIN_SETUP_SECRET` no header
2. Usar `ADMIN_DEFAULT_PASSWORD` em vez de senha hardcoded

## Passo 3: Corrigir Políticas RLS

Aplicar migrations SQL para:
1. Restringir UPDATE/DELETE no bucket `commerce-assets`
2. Restringir acesso ao `billing_config`

## Passo 4: Corrigir Lógica do Frontend

Atualizar `CommerceStorefront.tsx` para usar `payment_methods` do comércio em vez de `billing_config` da plataforma.

---

**Clique em "Approve" para continuar e ver a interface de adicionar secrets.**

