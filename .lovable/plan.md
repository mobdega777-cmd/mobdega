
# Plano: Card de Avaliacoes na Visao Geral + Respostas do Comercio

## Resumo

Adicionar um card de "Avaliacoes" na grade de cards do CommerceOverview (no espaco vazio marcado no anexo 1), permitindo ao comercio ver sua nota media e quantidade de resenhas. Ao clicar, abre um modal com todas as avaliacoes e a possibilidade de responder cada uma. As respostas aparecerao na visao do usuario (CommerceStorefront). Alem disso, uma notificacao sera enviada ao comercio quando receber uma nova avaliacao.

---

## Parte 1 -- Migracao de Banco de Dados

### 1.1 Coluna de resposta na tabela `reviews`

Adicionar duas colunas na tabela `reviews`:
- `commerce_reply` (text, nullable) -- texto da resposta do comercio
- `commerce_reply_at` (timestamptz, nullable) -- quando respondeu

### 1.2 Trigger de notificacao ao comercio

Criar trigger `notify_commerce_on_new_review` na tabela `reviews` (INSERT) que insere em `commerce_notifications`:
- type: `new_review`
- title: `Nova Avaliacao`
- message: `Voce recebeu uma avaliacao de X estrelas.`
- commerce_id: do review inserido

### 1.3 RLS

Permitir UPDATE na coluna `commerce_reply` e `commerce_reply_at` apenas pelo owner do comercio (via `is_commerce_owner_or_admin`).

---

## Parte 2 -- Card de Avaliacoes no CommerceOverview

**Arquivo:** `src/components/commerce/CommerceOverview.tsx`

- Buscar reviews do comercio no `fetchStats` (count + media)
- Adicionar novo stat card com icone `Star`:
  - Titulo: "Avaliacoes"
  - Valor: media (ex: 4.3) com quantidade entre parenteses
  - Tooltip: "Nota media das avaliacoes dos clientes e total de resenhas."
- Card sera **clicavel**, abrindo o modal de resenhas

---

## Parte 3 -- Modal de Resenhas do Comercio

**Novo arquivo:** `src/components/commerce/CommerceReviewsModal.tsx`

- Buscar reviews com perfil do usuario (nome)
- Listar cada review com: nome do usuario, data, estrelas, comentario
- Campo de texto + botao "Responder" em cada review (se ainda nao respondeu)
- Se ja respondeu, mostrar a resposta com data
- Paginacao (10 por pagina)

---

## Parte 4 -- Exibir respostas na visao do usuario

**Arquivo:** `src/components/user/CommerceStorefront.tsx`

- Alterar a query de reviews para incluir `commerce_reply` e `commerce_reply_at`
- Abaixo de cada review que tenha resposta, exibir um bloco com icone da loja, nome do comercio e texto da resposta (conforme desenhado no anexo 2)

---

## Parte 5 -- Notificacao na tela do comercio

O trigger de banco criara a notificacao automaticamente. O sino de notificacoes (`CommerceNotificationBell`) ja monitora `commerce_notifications`, entao a nova avaliacao aparecera automaticamente.

---

## Detalhes Tecnicos

**Migracoes SQL:**
```text
-- Colunas de resposta
ALTER TABLE public.reviews ADD COLUMN commerce_reply text;
ALTER TABLE public.reviews ADD COLUMN commerce_reply_at timestamptz;

-- Trigger de notificacao
CREATE FUNCTION notify_commerce_on_new_review() ...
  INSERT INTO commerce_notifications (commerce_id, type, title, message)
  VALUES (NEW.commerce_id, 'new_review', 'Nova Avaliacao', 
    'Voce recebeu uma avaliacao de ' || NEW.rating || ' estrelas.');

-- RLS para UPDATE de resposta pelo owner
CREATE POLICY "Commerce owner can reply to reviews"
  ON reviews FOR UPDATE
  USING (is_commerce_owner_or_admin(commerce_id))
  WITH CHECK (is_commerce_owner_or_admin(commerce_id));
```

**Arquivos modificados:**
- `src/components/commerce/CommerceOverview.tsx` -- novo card + estado do modal
- `src/components/user/CommerceStorefront.tsx` -- exibir respostas abaixo das reviews

**Arquivo criado:**
- `src/components/commerce/CommerceReviewsModal.tsx` -- modal completo com listagem e resposta
