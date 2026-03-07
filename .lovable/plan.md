

## Plano: Remover Ranking de todo o sistema

### Arquivos a deletar
- `src/pages/Ranking.tsx` — página pública de ranking
- `src/components/commerce/CommerceRanking.tsx` — componente ranking do comércio
- `src/components/admin/AdminRanking.tsx` — componente ranking do admin

### Arquivos a editar

1. **`src/App.tsx`** — Remover import de `Ranking`, remover a rota `/ranking`

2. **`src/pages/admin/AdminDashboard.tsx`** — Remover import `AdminRanking`, remover `"ranking"` do type `AdminSection`, remover item do `menuItems`, remover case `"ranking"` do `renderContent`, remover import `Trophy`

3. **`src/pages/commerce/CommerceDashboard.tsx`** — Remover import `CommerceRanking`, remover `"ranking"` do type `CommerceSection`, remover item do `menuItems`, remover case `"ranking"` do `renderContent`

4. **`src/lib/planFeatures.ts`** — Remover entrada `ranking: "Ranking"` do `menuItemLabels`

5. **`src/lib/pdfReportGenerator.ts`** — Remover seção "Ranking e Avaliações" (página 11) e campos relacionados

6. **`src/pages/SobreNos.tsx`** — Remover menção a "Rankings e visibilidade" da lista de features

7. **`src/components/user/CommerceStorefront.tsx`** — A função `refreshPlanAccess` usa `get_ranking_commerces` RPC mas para buscar info de plano, não para ranking em si. Manter mas verificar se precisa renomear/ajustar.

### Sem alterações no banco de dados
Nenhuma migração necessária. A RPC `get_ranking_commerces` pode permanecer pois é usada para outros fins (storefront).

