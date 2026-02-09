

## Plano: Correcoes de Seguranca

### O que sera feito

**3 alteracoes no banco de dados** (nenhum arquivo de codigo sera modificado):

---

### 1. Restringir acesso a tabela `profiles`

**Politica atual removida:**
- "Authenticated users can view profiles" (qualquer logado ve tudo)

**Novas politicas criadas:**
- Usuarios veem apenas o proprio perfil
- Donos de comercio veem perfis de clientes que fizeram pedidos no seu estabelecimento (necessario para fulfillment, entrega, e visualizacao de clientes)
- Master admin ve todos os perfis

**Impacto nos fluxos existentes:** Nenhum. Todos os locais do codigo ja buscam perfis dentro dessas 3 categorias.

---

### 2. Granularizar politicas de `cash_registers`

**Politica atual removida:**
- "Commerce owners can manage cash registers" (ALL generico)

**Novas politicas criadas (4 separadas):**
- SELECT: dono do comercio pode ver seus caixas
- INSERT: dono do comercio pode criar caixas
- UPDATE: dono do comercio pode atualizar seus caixas
- DELETE: dono do comercio pode deletar seus caixas

Todas usam `is_commerce_owner_or_admin(commerce_id)`. A mesma logica de antes, porem granular e explicita.

**Impacto nos fluxos existentes:** Nenhum. O acesso continua identico, apenas mais bem definido.

---

### 3. Adicionar DELETE em `commerce_notifications`

**Nova politica criada:**
- Donos de comercio podem deletar notificacoes do seu proprio comercio

**Impacto nos fluxos existentes:** Nenhum. Apenas adiciona uma capacidade que nao existia.

---

### Resumo de impacto

| Fluxo | Antes | Depois |
|-------|-------|--------|
| Usuario ve proprio perfil | Funciona | Funciona |
| Comerciante ve clientes | Funciona | Funciona |
| Master admin ve todos | Funciona | Funciona |
| Caixa registradora | Funciona | Funciona |
| Notificacoes | Funciona (sem delete) | Funciona (com delete) |
| Hacker rouba dados | Possivel | Bloqueado |

---

### Detalhes tecnicos

Migracao SQL unica com:

```text
1. DROP POLICY "Authenticated users can view profiles" ON profiles
2. CREATE POLICY para usuario ver proprio perfil (auth.uid() = user_id)
3. CREATE POLICY para comerciante ver clientes com pedidos (EXISTS subquery em orders + commerces)
4. CREATE POLICY para master_admin ver todos (is_master_admin())
5. DROP POLICY "Commerce owners can manage cash registers" ON cash_registers
6. CREATE 4 politicas granulares (SELECT/INSERT/UPDATE/DELETE) com is_commerce_owner_or_admin()
7. CREATE POLICY DELETE em commerce_notifications para donos de comercio
```

Aplicacao da mesma politica `cash_movements` que ja usa o mesmo padrao granular.

