

## Plano: Zerar faturas e dados financeiros

### O que será feito

Deletar todas as 34 faturas existentes na tabela `invoices` e resetar os dados financeiros relacionados para recomeçar do zero.

### Dados a serem removidos

| Tabela | Registros | Ação |
|--------|-----------|------|
| `invoices` | 34 | Deletar todos |
| `financial_transactions` | 0 | Já vazia |

### Passos de implementação

1. **Deletar todas as faturas** — Executar `DELETE FROM invoices` via ferramenta de dados
2. **Limpar notificações de faturas** — Remover notificações do tipo `new_invoice` e `payment_confirmation` das tabelas `commerce_notifications` e `admin_notifications`

Os cards de overview (AdminOverview, CommerceFinancial, etc.) já calculam valores dinamicamente a partir das tabelas, então ao deletar os dados, os valores zerarão automaticamente.

