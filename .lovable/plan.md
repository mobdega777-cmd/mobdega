
# Plano de Correção dos 5 Erros de Segurança

## Resumo Executivo

Este plano aborda as 5 vulnerabilidades críticas identificadas pelo scan de segurança, garantindo que todas as funcionalidades existentes continuem operando normalmente.

---

## Erro 1: Endpoint de Criação de Admin Publicamente Acessível

### Problema
A edge function `create-admin-user` pode ser chamada por qualquer pessoa, permitindo potencialmente a criação de administradores não autorizados.

### Solução
Adicionar validação de um secret token (ADMIN_SETUP_SECRET) que deve ser enviado no header da requisição.

### Implementação
1. Criar um secret `ADMIN_SETUP_SECRET` no backend
2. Modificar a edge function para exigir esse token no header `Authorization`
3. Retornar erro 401 se o token não for fornecido ou estiver incorreto

### Impacto nas Funcionalidades
**Nenhum** - O admin já foi criado. A função só é usada uma vez durante o setup inicial. Após a correção, chamar a função sem o secret retornará erro.

---

## Erro 2: Senha do Admin Hardcoded no Código

### Problema
A senha `623501Ab.` está exposta diretamente no código fonte da edge function.

### Solução
Mover a senha para uma variável de ambiente (secret) e remover do código.

### Implementação
1. Criar um secret `ADMIN_DEFAULT_PASSWORD` no backend (ou usar uma senha gerada aleatoriamente)
2. Atualizar a edge function para usar `Deno.env.get("ADMIN_DEFAULT_PASSWORD")`
3. Manter o código limpo sem senhas expostas

### Impacto nas Funcionalidades
**Nenhum** - O admin já existe e pode alterar sua senha nas configurações. A edge function de criação não afeta o funcionamento atual.

---

## Erro 3: Assets de Comércios Modificáveis por Qualquer Usuário

### Problema
As políticas RLS do bucket `commerce-assets` permitem que qualquer usuário autenticado modifique ou delete arquivos de outros comércios.

Políticas atuais:
- UPDATE: `bucket_id = 'commerce-assets'` (sem verificação de propriedade)
- DELETE: `bucket_id = 'commerce-assets'` (sem verificação de propriedade)

### Solução
Atualizar as políticas para verificar se o usuário é dono do comércio ao qual o arquivo pertence.

### Implementação
1. Criar função auxiliar para verificar propriedade de arquivo
2. Atualizar política de UPDATE para verificar propriedade via path do arquivo
3. Atualizar política de DELETE para verificar propriedade via path do arquivo

A estrutura de pastas usa o commerce_id como prefixo:
- `{commerce_id}/logo.png`
- `{commerce_id}/products/...`
- `{commerce_id}/photos/...`

SQL de correção:
```text
-- Remover políticas antigas
DROP POLICY "Users can update their own commerce assets" ON storage.objects;
DROP POLICY "Users can delete their own commerce assets" ON storage.objects;

-- Criar novas políticas com verificação de propriedade
CREATE POLICY "Commerce owners can update their assets" 
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'commerce-assets' 
  AND (
    is_master_admin() 
    OR EXISTS (
      SELECT 1 FROM public.commerces 
      WHERE id::text = (storage.foldername(name))[1]
      AND owner_id = auth.uid()
    )
  )
);

CREATE POLICY "Commerce owners can delete their assets" 
ON storage.objects FOR DELETE
USING (
  bucket_id = 'commerce-assets' 
  AND (
    is_master_admin() 
    OR EXISTS (
      SELECT 1 FROM public.commerces 
      WHERE id::text = (storage.foldername(name))[1]
      AND owner_id = auth.uid()
    )
  )
);
```

### Impacto nas Funcionalidades
**Nenhum** - Os comércios continuam podendo gerenciar seus próprios arquivos. Apenas impede que um comércio modifique arquivos de outro.

---

## Erro 4: Dados Pessoais de Clientes Acessíveis por Comércios

### Problema
A política atual permite que donos de comércio visualizem TODOS os campos do perfil de clientes que fizeram pedidos, incluindo dados sensíveis como CPF, endereço completo e aniversário.

### Solução
Limitar os campos que comércios podem visualizar apenas ao necessário para entrega e contato.

### Implementação
Opção A - Modificar a política RLS para usar uma função que retorna apenas campos permitidos (complexo e pode não funcionar bem com RLS).

Opção B (Recomendada) - Manter a política mas garantir que o código frontend só solicite os campos necessários. No entanto, isso não resolve o problema de segurança real.

Opção C (Mais Segura) - Criar uma VIEW separada com apenas os campos permitidos para comércios e usar políticas nessa view.

### Implementação Recomendada (Opção B simplificada)
Como a tabela `profiles` atualmente está vazia (os dados não foram populados), e o risco é baixo no momento:
1. Documentar que a política atual é permissiva
2. Atualizar para remover campos críticos (document, birthday) da visualização por comércios

Na prática, a política "Commerce owners can view customer profiles" precisa ser aceita porque comércios precisam ver nome, telefone e endereço para entregas.

### Impacto nas Funcionalidades
**Baixo** - A funcionalidade de ver clientes (se existente) continuará funcionando. Apenas limitamos quais dados podem ser vistos.

---

## Erro 5: Dados Bancários da Plataforma Expostos

### Problema
A política `Anyone can read billing config` permite que qualquer pessoa (incluindo anônimos) veja os dados bancários da plataforma.

Usos atuais:
- `InvoicePaymentModal.tsx` - Comércios veem PIX para pagar faturas
- `CommerceStorefront.tsx` - Parece buscar PIX da plataforma (possível erro de lógica - deveria ser PIX do comércio)

### Solução
Restringir acesso apenas a:
1. Master admin (gerenciar)
2. Usuários autenticados com role 'commerce' (visualizar para pagamento)

### Implementação
```text
-- Remover política antiga
DROP POLICY "Anyone can read billing config" ON public.billing_config;

-- Nova política: apenas comércios e admins podem ver
CREATE POLICY "Commerce owners and admins can read billing config" 
ON public.billing_config FOR SELECT
USING (
  is_master_admin() 
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('commerce', 'master_admin')
  )
);
```

### Correção Adicional
No arquivo `CommerceStorefront.tsx`, a busca de `billing_config` parece incorreta - está buscando dados bancários da PLATAFORMA quando deveria buscar dados do COMÉRCIO (para PIX do comércio). Isso deve ser investigado e corrigido para usar `payment_methods` do comércio.

### Impacto nas Funcionalidades
**Nenhum para funcionalidades legítimas** - Comércios continuam vendo o PIX para pagar suas faturas. Usuários anônimos (que não precisam dessa informação) serão bloqueados.

---

## Resumo das Alterações

| Erro | Arquivos Afetados | Tipo de Alteração |
|------|-------------------|-------------------|
| 1 | `create-admin-user/index.ts` | Adicionar validação de secret |
| 2 | `create-admin-user/index.ts` | Usar env var para senha |
| 3 | Migration SQL | Atualizar políticas storage |
| 4 | Migration SQL (opcional) | Avaliar necessidade real |
| 5 | Migration SQL + `CommerceStorefront.tsx` | Restringir política + corrigir lógica |

## Ordem de Execução Recomendada

1. **Erro 2** - Remover senha hardcoded (edge function)
2. **Erro 1** - Proteger endpoint (edge function)  
3. **Erro 3** - Corrigir políticas de storage (migration)
4. **Erro 5** - Restringir billing_config (migration)
5. **Erro 4** - Avaliar e documentar (menor prioridade)

## Secrets Necessários

Será necessário criar estes secrets:
- `ADMIN_SETUP_SECRET` - Token para autorizar chamadas à edge function de admin
- `ADMIN_DEFAULT_PASSWORD` - Senha inicial do admin (opcional, já que admin existe)

## Testes Após Correção

1. Verificar que comércios ainda conseguem fazer upload de logo/produtos
2. Verificar que comércios conseguem ver e pagar faturas
3. Verificar que a storefront do cliente funciona corretamente
4. Verificar que o painel admin continua funcionando

