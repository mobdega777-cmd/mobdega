

## Plano: Sistema de Comandas Separadas para Mesas

### Status: ✅ Fase 2 Implementada

---

### O que foi implementado:

#### Fase 1 (Anterior):
- Tabelas `table_sessions` e `table_participants`
- Modal de escolha de comanda (BillModeModal)
- Modal de juntar-se à mesa (JoinSessionModal)
- Botão "Pedir Conta" na comanda

#### Fase 2 (Atual):
1. ✅ **Coluna bill_requested** adicionada à tabela `table_participants`
2. ✅ **Botão "Pedir Conta"** agora atualiza `bill_requested=true` no banco
3. ✅ **Badge animado no menu Caixa** quando há pedidos de conta pendentes
4. ✅ **Card de mesa com destaque** quando participante pede conta
5. ✅ **Estratificação por participante** no Caixa/PDV para comandas separadas
6. ✅ **Fechamento individual** de comanda por participante
7. ✅ **Botão "Unificar Contas"** para fechar todas juntas se necessário

---

### Próximos Passos (Fase 3 - Opcional):

1. Notificação sonora/visual quando cliente pede conta
2. Histórico de sessões de mesa fechadas
3. Relatório de comandas separadas vs únicas
