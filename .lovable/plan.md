
# Correção: Bloquear acesso a mesas com Comanda Única

## Problema
Quando uma mesa está em modo "Comanda Única" (bill_mode = 'single'), outros usuários ainda conseguem ver o modal "Juntar-se à Mesa" e potencialmente entrar na sessão. O comportamento correto é bloquear o acesso, pois comanda única significa que apenas o host utiliza a mesa.

## Solução
No componente `CommerceStorefront.tsx`, na lógica de seleção de mesa (por volta da linha 1254), adicionar uma verificação do `bill_mode` da sessão ativa. Se for `'single'`, em vez de abrir o `JoinSessionModal`, exibir um toast informando que a mesa está em uso com comanda única e não permite entrada de outros usuários.

Também atualizar a visualização no seletor de mesas: mesas com comanda única devem aparecer com indicador vermelho (Reservada/Fechada) ao invés de laranja (pode juntar-se), já que não é possível entrar nelas.

## Detalhes Técnicos

**Arquivo:** `src/components/user/CommerceStorefront.tsx`

**Mudança 1 - Bloquear join (linhas ~1254-1274):**
Após obter `sessionInfo`, verificar `sessionInfo.bill_mode === 'single'`. Se verdadeiro:
- Mostrar toast: "Esta mesa está em uso com comanda única e não permite novos participantes."
- Não abrir o `JoinSessionModal`
- Retornar sem ação

**Mudança 2 - Indicador visual no seletor de mesas:**
Na renderização dos cards de mesa, mesas ocupadas com `bill_mode === 'single'` devem exibir borda vermelha e texto "Ocupada" (sem "Juntar-se"), indicando que não é possível entrar. Apenas mesas com `bill_mode === 'split'` mostram a borda laranja com "Juntar-se".

Nenhuma alteração de layout ou estrutura existente.
