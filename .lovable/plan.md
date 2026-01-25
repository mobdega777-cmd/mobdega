

## Plano: Sistema de Comandas Separadas para Mesas

### Status: ✅ Fase 1 Implementada

---

### O que foi implementado:

#### 1. ✅ Banco de Dados
- Tabela `table_sessions` criada - gerencia sessões ativas de mesas
- Tabela `table_participants` criada - vincula múltiplos usuários a uma sessão
- Coluna `session_id` adicionada às tabelas `tables` e `orders`
- Políticas RLS configuradas para segurança
- Realtime habilitado para sincronização

#### 2. ✅ Modal de Escolha de Comanda (BillModeModal)
- Quando usuário seleciona mesa disponível, popup aparece
- Opção "Comanda Única" - todos pagam juntos
- Opção "Comandas Separadas" - cada pessoa paga sua conta
- Cria sessão e define usuário como host

#### 3. ✅ Modal de Juntar-se à Mesa (JoinSessionModal)
- Quando usuário seleciona mesa ocupada com sessão ativa
- Mostra informações: host, tipo de comanda, participantes
- Permite juntar-se à sessão existente

#### 4. ✅ Atualização do Modal de Seleção de Mesas
- Verde: Mesa disponível - abre nova sessão
- Amarelo/Laranja: Mesa ocupada com sessão - pode juntar-se
- Vermelho: Mesa reservada/fechada - bloqueada

#### 5. ✅ Botão "Pedir Conta" na Comanda
- Adicionado abaixo do total
- Visual placeholder (ação futura)

#### 6. ✅ Indicação de Modo na Comanda
- Título mostra "Sua Comanda Pessoal" para modo split
- Badge indica tipo de comanda (Única/Separada)

---

### Próximos Passos (Fase 2 - a implementar):

1. **Filtrar itens por usuário em modo split**
   - Em `bill_mode = 'split'`, mostrar apenas itens do usuário atual
   - Em `bill_mode = 'single'`, mostrar todos os itens de todos participantes

2. **Vincular orders ao session_id**
   - Ao criar pedido, incluir `session_id` para rastreabilidade

3. **Painel do Caixa/PDV**
   - Mostrar lista de participantes quando mesa tem `bill_mode = 'split'`
   - Permitir fechar conta individual de cada participante
   - Opção de "Unificar contas" se necessário

4. **Fechamento de Sessão**
   - Quando caixa fecha conta, encerrar sessão
   - Liberar mesa automaticamente

5. **Ação do Botão "Pedir Conta"**
   - Notificar caixa via realtime
   - Ou abrir modal de pagamento se `table_payment_required` estiver ativo
