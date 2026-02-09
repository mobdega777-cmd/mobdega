

## Plano: Corrigir nomes que sumiram apos correcao de seguranca

### Problema
A restricao de seguranca nos `profiles` bloqueou corretamente dados sensiveis, mas tambem bloqueou a leitura de **nomes** (full_name) em contextos onde o usuario logado nao e o dono do perfil, nem comerciante com pedidos daquele cliente.

### Fluxos afetados
- Vitrine do cliente: nomes dos avaliadores aparecem como "Usuario"
- Modal de avaliacoes do comerciante: nomes de avaliadores sem pedidos nao aparecem
- PDV (Lancar em Comanda): nomes de participantes de mesa podem nao aparecer
- Financeiro: nomes de top clientes podem falhar se o contexto de RLS nao cobrir

### Solucao

Criar uma funcao RPC `get_profile_names(p_user_ids uuid[])` com SECURITY DEFINER que retorna **apenas** `user_id` e `full_name` — nenhum dado sensivel (CPF, telefone, endereco, email).

Depois, substituir as chamadas diretas a `profiles` por essa RPC nos locais que precisam apenas do nome.

### O que NAO muda
- Nenhum layout, estrutura visual ou fluxo sera alterado
- As politicas de seguranca aplicadas continuam intactas (dados sensiveis protegidos)
- Apenas a forma de buscar nomes muda internamente

### Detalhes tecnicos

**1. Migracao SQL — criar RPC:**

```text
CREATE FUNCTION get_profile_names(p_user_ids uuid[])
RETURNS TABLE(user_id uuid, full_name text)
SECURITY DEFINER
-- Retorna APENAS user_id e full_name
-- Qualquer usuario autenticado pode chamar
```

**2. Arquivos que serao atualizados (substituir `.from('profiles').select('user_id, full_name')` por `.rpc('get_profile_names', { p_user_ids: [...] })`):**

- `src/components/user/CommerceStorefront.tsx` (avaliacoes na vitrine)
- `src/components/commerce/CommerceReviewsModal.tsx` (avaliacoes no painel do comerciante)
- `src/components/commerce/AddToTabModal.tsx` (nomes de participantes de mesa)
- `src/components/commerce/CommerceFinancial.tsx` (top clientes no financeiro)

**3. Nenhuma outra alteracao:**
- Arquivos de layout, CSS, estrutura de componentes — nada muda
- Politicas RLS de profiles — permanecem restritivas (dados sensiveis protegidos)
- Fluxos de mesa, comanda, pedidos — continuam identicos

