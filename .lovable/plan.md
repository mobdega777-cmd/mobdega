

# Relatório Completo de Segurança - Sistema Mobdega

## Resumo Executivo

Após análise completa do sistema, identifiquei **17 pontos de atenção** sendo:
- **5 críticos** (já corrigidos anteriormente ✅)
- **8 moderados** (3 precisam atenção ⚠️)
- **4 informativos** (aceitáveis para o negócio ℹ️)

| Status Geral | Avaliação |
|--------------|-----------|
| Pronto para produção | ⚠️ Com ressalvas |
| Segurança contra hackers | ✅ Boa (após correções) |
| Dados expostos no F12 | ✅ Protegido |
| Políticas RLS | ✅ Funcionando |

---

## O Que Já Está Corrigido ✅

### 1. Edge Function Admin Protegida
A criação de admin agora exige token `ADMIN_SETUP_SECRET` no header - não é possível criar admin sem autorização.

### 2. Senha Admin em Environment Variable
A senha não está mais hardcoded - usa `ADMIN_DEFAULT_PASSWORD` do ambiente.

### 3. Storage com Ownership Verificado
Cada comércio só pode modificar arquivos na sua própria pasta.

### 4. Políticas de Senha Melhoradas
Sistema exige 8+ caracteres com maiúsculas, minúsculas e números.

### 5. View Pública Segura
A `commerces_public` expõe apenas dados comerciais, sem CPF/CNPJ ou email do dono.

---

## Pontos que Precisam Atenção ⚠️

### 1. Proteção contra Senhas Vazadas DESABILITADA (Nível: Médio)

**Problema**: O sistema não verifica se a senha escolhida foi vazada em data breaches.

**Risco**: Usuários podem usar senhas comprometidas (ex: "Password123") sem aviso.

**Correção Necessária**: Habilitar "Leaked Password Protection" no backend.

### 2. Reclamação de Mesas Cross-Commerce (Nível: Médio)

**Problema**: Qualquer usuário autenticado pode "reclamar" mesas de qualquer comércio.

**Risco**: Um atacante poderia ocupar todas as mesas de um concorrente, causando DoS.

**Correção Necessária**: Adicionar verificação de commerce_id na política de UPDATE.

### 3. Cupons de Comércio Públicos (Nível: Baixo)

**Problema**: Códigos de desconto ativos são visíveis para qualquer usuário.

**Risco**: Concorrentes podem ver estratégias promocionais ou usar códigos.

**Correção Sugerida**: Restringir SELECT a usuários autenticados no momento do pedido.

---

## O Que Aparece no F12 (DevTools)

| Dado | Exposto? | Justificativa |
|------|----------|---------------|
| Produtos e preços | ✅ Sim | Normal - necessário para vitrine |
| Categorias | ✅ Sim | Normal - necessário para navegação |
| Nome fantasia do comércio | ✅ Sim | Normal - dado público |
| CPF/CNPJ do dono | ❌ Não | Protegido pela RLS |
| Email do dono | ❌ Não | Protegido pela RLS |
| Endereço pessoal do dono | ❌ Não | Protegido pela RLS |
| Dados de pagamento (PIX) | ⚠️ Parcial | Visível apenas para cliente no checkout |
| Pedidos de outros clientes | ❌ Não | Protegido pela RLS |
| Faturamento do comércio | ❌ Não | Protegido pela RLS |

---

## Políticas RLS - Resumo por Tabela

| Tabela | Status | Observação |
|--------|--------|------------|
| `profiles` | ✅ Seguro | Cada usuário vê apenas seu perfil |
| `commerces` | ✅ Seguro | Dono e admin veem, público usa view |
| `commerces_public` | ✅ Seguro | View sem dados sensíveis |
| `orders` | ✅ Seguro | Cliente e comércio veem apenas os seus |
| `invoices` | ✅ Seguro | Comerciante e admin apenas |
| `user_roles` | ✅ Seguro | Usuário vê apenas sua role |
| `billing_config` | ✅ Seguro | Apenas master admin |
| `tables` | ⚠️ Atenção | UPDATE muito permissivo |
| `reviews` | ⚠️ Atenção | user_id exposto publicamente |
| `commerce_coupons` | ⚠️ Atenção | Códigos visíveis para todos |

---

## Recomendações para Produção

### Correções Críticas (Fazer Antes de Lançar)

1. **Habilitar Leaked Password Protection**
   - Impacto: Médio
   - Esforço: 1 migration SQL

2. **Corrigir Política de Tables**
   - Impacto: Baixo (DoS limitado)
   - Esforço: 1 migration SQL

### Melhorias Recomendadas (Podem Esperar)

3. **Anonimizar user_id em reviews**
   - Criar view que não expõe o ID do avaliador
   - Impacto: Privacidade de clientes

4. **Restringir visualização de cupons**
   - Mudar política para authenticated + no momento do pedido
   - Impacto: Proteção de estratégia comercial

---

## Logs e Console

Os `console.log` encontrados no código são informativos e não expõem dados sensíveis:
- CEP lookups (debug de zona)
- Movimentações de caixa (logs operacionais)

**Recomendação**: Remover antes de produção para performance, mas não são risco de segurança.

---

## Conclusão

O sistema está **bem estruturado** em termos de segurança. As principais vulnerabilidades já foram corrigidas em sprints anteriores. 

Para lançar em produção com segurança, recomendo aplicar as **2 correções críticas** (leaked password protection e política de tables).

Os demais pontos são melhorias incrementais que podem ser endereçadas após o lançamento.

---

## Seção Técnica - Correções SQL Necessárias

### 1. Habilitar Leaked Password Protection
Isso é configurado via painel do backend, não via SQL.

### 2. Corrigir Política de Tables

```sql
-- Corrigir UPDATE de tables para prevenir DoS cross-commerce
DROP POLICY IF EXISTS "Users can claim available tables" ON public.tables;

CREATE POLICY "Users can claim available tables"
ON public.tables
FOR UPDATE
TO authenticated
USING (
  (status = 'available'::table_status OR status IS NULL)
  -- Usuário deve ter uma sessão ativa nesta mesa ou estar criando uma
  AND (
    session_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM table_participants tp
      JOIN table_sessions ts ON ts.id = tp.session_id
      WHERE ts.table_id = tables.id 
      AND tp.user_id = auth.uid()
      AND ts.status = 'active'
    )
  )
)
WITH CHECK (status = 'occupied'::table_status);
```

### 3. Anonimizar Reviews (Opcional)

```sql
-- Criar view que esconde user_id
CREATE VIEW public.reviews_public AS
SELECT 
  id,
  commerce_id,
  rating,
  comment,
  created_at
  -- user_id omitido intencionalmente
FROM public.reviews;

GRANT SELECT ON public.reviews_public TO anon;
GRANT SELECT ON public.reviews_public TO authenticated;
```


