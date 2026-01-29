
# Plano de Implementação: 7 Funcionalidades Solicitadas

## Resumo das Alterações

| # | Funcionalidade | Arquivos Afetados |
|---|----------------|-------------------|
| 1 | Avaliação única por usuário (com edição) | `CommerceStorefront.tsx` |
| 2 | Fatura automática 10 dias antes + validação valores | `AdminInvoices.tsx`, Edge Function |
| 3 | Botão compartilhar abre vitrine pública | `CommerceOverview.tsx`, `App.tsx`, `Index.tsx` |
| 4 | Aviso anti-fraude no Ranking | `CommerceRanking.tsx`, `Ranking.tsx` |
| 5 | Prompt PWA melhorado | `PWAInstallPrompt.tsx` |
| 6 | Ícone narguile (substituir talheres) | `CommerceStorefront.tsx` (ícone SVG customizado) |

---

## Detalhes Técnicos

### 1. Sistema de Avaliação Única (com Edição)

**Problema Atual:**
- O usuário pode clicar em "Adicionar Avaliação" mesmo já tendo avaliado
- Ao enviar, recebe erro `23505` (chave duplicada) - comportamento correto, mas UX ruim

**Solução:**
- Verificar se o usuário já avaliou o comércio ao carregar a página
- Se já avaliou: mostrar botão "Editar Avaliação" e preencher o modal com os dados existentes
- Usar `UPDATE` em vez de `INSERT` quando for edição
- Atualizar `updated_at` ao editar

**Alterações em `CommerceStorefront.tsx`:**
```typescript
// Novos estados
const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
const [hasUserReviewed, setHasUserReviewed] = useState(false);

// Na função fetchCommerceData, verificar avaliação existente
if (user) {
  const { data: userReview } = await supabase
    .from('reviews')
    .select('id, rating, comment')
    .eq('commerce_id', commerceId)
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (userReview) {
    setHasUserReviewed(true);
    setExistingReviewId(userReview.id);
    setReviewRating(userReview.rating);
    setReviewComment(userReview.comment || "");
  }
}

// Modificar submitReview para usar UPDATE quando existir
const submitReview = async () => {
  if (existingReviewId) {
    // UPDATE existente
    await supabase
      .from('reviews')
      .update({ rating: reviewRating, comment: reviewComment, updated_at: new Date().toISOString() })
      .eq('id', existingReviewId);
  } else {
    // INSERT novo
    await supabase.from('reviews').insert({...});
  }
}

// Botão condicional
<Button onClick={() => setShowReviewModal(true)}>
  {hasUserReviewed ? 'Editar Avaliação' : 'Adicionar Avaliação'}
</Button>
```

---

### 2. Fatura Automática 10 Dias Antes

**Situação Atual:**
- `auto_invoice_day` define o dia de vencimento
- Não há geração automática - apenas manual via "Gerar Faturas do Mês"
- Valores não consideram cupons aplicados

**Solução:**
Criar uma Edge Function que:
1. Roda diariamente (via cron externo ou chamada manual)
2. Para cada comércio com `auto_invoice_enabled = true`:
   - Calcula a data de vencimento: dia `auto_invoice_day` do próximo mês
   - Gera a fatura 10 dias antes dessa data
   - Aplica desconto do cupom se `coupon_code` existir
3. Valida sincronização com `payment_due_day` no Contrato

**Nova Edge Function: `generate-auto-invoices`**
```typescript
// Busca comércios com fatura automática ativada
// Para cada um, verifica se já existe fatura para o mês seguinte
// Se não existir e estiver a 10 dias do vencimento, cria a fatura
// Aplica desconto do cupom (tabela discount_coupons)
```

**Validação Contrato:**
- O Contrato já usa `payment_due_day` corretamente
- Garantir que o valor final considera o cupom (já implementado em `CommerceContract.tsx`)

---

### 3. Botão Compartilhar Abre Vitrine Pública

**Problema:**
- O botão "Compartilhar" em `CommerceOverview.tsx` compartilha `www.mobdega.shop` genérico
- Deveria abrir a vitrine específica do comércio

**Solução:**
1. Criar rota pública `/loja/:commerceId`
2. Modificar `shareUrl` para usar essa rota
3. Na rota, se usuário não logado e clicar em ação (Mesa, Delivery), abrir modal de login

**Alterações:**

**`App.tsx` - Nova rota pública:**
```tsx
import Storefront from "./pages/Storefront"; // Nova página

<Route path="/loja/:commerceId" element={<Storefront />} />
```

**Nova página `src/pages/Storefront.tsx`:**
```tsx
// Renderiza CommerceStorefront para o comércio específico
// Se usuário não logado e tentar ação, mostra AuthModal
```

**`CommerceOverview.tsx` - Atualizar shareUrl:**
```typescript
const shareUrl = `https://mobdega.lovable.app/loja/${commerce.id}`;
const shareMessage = `🎉 Conheça ${commerce.fantasy_name}!\n\n✨ Novidades:\n📱 Cardápio digital\n🛵 Pedidos delivery pelo app\n💳 Pagamento online\n\nAcesse: ${shareUrl}`;
```

---

### 4. Aviso Anti-Fraude no Ranking

**Local:** Card "Como funciona o Ranking" em `CommerceRanking.tsx` e `Ranking.tsx`

**Texto a adicionar:**
```tsx
<div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
  <p className="font-semibold text-destructive mb-1 flex items-center gap-2">
    <AlertTriangle className="w-4 h-4" />
    Aviso Importante - Fraudes
  </p>
  <p className="text-sm">
    A criação de contas falsas, avaliações fraudulentas ou qualquer tentativa de 
    manipulação do ranking resultará no <strong>banimento imediato</strong> do 
    estabelecimento da competição, sem direito a recurso. Todas as atividades 
    são monitoradas.
  </p>
</div>
```

---

### 5. Prompt PWA Melhorado

**Situação Atual:**
- O prompt aparece após 3 segundos se `shouldShowPrompt` retornar true
- `shouldShowPrompt` já verifica `localStorage.getItem('pwa-install-dismissed')`

**Melhoria:**
- Adicionar verificação se usuário já instalou (já existe via `isInstalled`)
- Adicionar pergunta mais clara ao usuário
- Armazenar quando foi a última recusa para não perguntar repetidamente

**Alterações em `PWAInstallPrompt.tsx` e `usePWAInstall.tsx`:**
```typescript
// Verificar se foi instalado via localStorage também
const checkInstalled = () => {
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if (localStorage.getItem('pwa-installed') === 'true') return true;
  return false;
};

// Ao instalar com sucesso, salvar no localStorage
if (outcome === 'accepted') {
  localStorage.setItem('pwa-installed', 'true');
}
```

---

### 6. Ícone de Narguile (Substituir Talheres)

**Problema:** 
- Lucide-react não possui ícone de narguile/hookah
- Atualmente usa `UtensilsCrossed` (talheres) no modal de status do pedido

**Solução:**
Criar um componente SVG customizado para narguile:

```tsx
// src/components/ui/hookah-icon.tsx
const HookahIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    {/* Base do narguile */}
    <ellipse cx="12" cy="20" rx="5" ry="2" />
    {/* Corpo/vaso */}
    <path d="M9 18 C9 15, 7 14, 7 11 C7 8, 10 6, 12 6 C14 6, 17 8, 17 11 C17 14, 15 15, 15 18" />
    {/* Haste central */}
    <line x1="12" y1="6" x2="12" y2="2" />
    {/* Fornilho/cabeça */}
    <path d="M10 2 h4 v2 h-4 z" />
    {/* Mangueira */}
    <path d="M17 11 Q20 11, 21 14 Q22 17, 19 18" />
    {/* Ponteira */}
    <circle cx="19" cy="19" r="1" />
  </svg>
);
```

**Locais para substituir `UtensilsCrossed`:**
- `CommerceStorefront.tsx` linha 2485: Modal de status do pedido (step "Preparando")

---

## Ordem de Implementação

1. **Ícone Hookah** - Criar componente SVG
2. **Avaliação única** - Lógica de verificação e edição
3. **Compartilhar vitrine** - Nova rota e ajuste URL
4. **Aviso fraude Ranking** - Adicionar card de alerta
5. **PWA prompt** - Melhorias no armazenamento local
6. **Fatura automática** - Edge Function + scheduler

---

## Prévia do Ícone de Narguile

Como não existe ícone de narguile no Lucide, vou criar um SVG customizado. Antes de implementar, posso mostrar uma prévia visual do ícone proposto para sua aprovação.

O ícone terá:
- Base/vaso arredondado (parte inferior)
- Haste central
- Fornilho/cabeça no topo (onde vai o carvão)
- Mangueira curvada com ponteira

Posso prosseguir com esta implementação ou prefere ajustar algum detalhe?
