

## Aumentar limite de atualizacoes exibidas para 20

### Problema

O componente `SystemUpdates.tsx` busca ate 15 registros, mas so existem 3 na base. O usuario quer ver as ultimas 20.

### Alteracao

**Arquivo: `src/components/commerce/SystemUpdates.tsx`**
- Alterar `.limit(15)` para `.limit(20)` na query do Supabase
- Atualizar o texto do subtitulo de `Últimas ${updates.length} modificações técnicas` (ja e dinamico, entao so o limit precisa mudar)

Alteracao de uma unica linha. Nenhuma migracao necessaria.

