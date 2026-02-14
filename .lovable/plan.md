

## Notificacoes Completas para o Comercio

### Resumo

Implementar todas as notificacoes identificadas para o painel do comercio, exceto ranking (descartado).

### Notificacoes a implementar

| # | Evento | Tipo | Trigger em | Destino |
|---|--------|------|------------|---------|
| 1 | Novo topico no forum | `new_forum_topic` | `forum_topics` INSERT | Secao forum |
| 2 | Cliente favoritou loja | `new_favorite` | `favorites` INSERT | Secao overview |
| 3 | Novo pedido recebido | `new_order` | `orders` INSERT | Secao orders |
| 4 | Estoque baixo (<=5 un.) | `low_stock` | Via trigger de stock deduction | Secao stock |
| 5 | Nova atualizacao do sistema | `new_system_update` | `system_updates` INSERT | Secao updates |
| 6 | Resposta no forum ao topico do comercio | `forum_reply` | `forum_replies` INSERT (se topic autor = comercio) | Secao forum |
| 7 | Abertura/Fechamento de caixa | `cash_register_event` | `cash_registers` INSERT/UPDATE | Secao cash-register |

**Nota sobre cupons vencendo:** esse tipo de notificacao depende de tempo (verificar diariamente quais cupons estao prestes a vencer), nao de um evento de INSERT/UPDATE. Seria necessario um job agendado (cron). Se quiser, posso incluir numa etapa futura.

### Migracao SQL (7 triggers + funcoes)

**1. `notify_commerces_on_new_forum_topic`**
- Tabela: `forum_topics` (INSERT)
- Insere notificacao para cada comercio aprovado
- Mensagem: "Novo topico: [titulo]"

**2. `notify_commerce_on_new_favorite`**
- Tabela: `favorites` (INSERT)
- Busca nome do usuario em `profiles` e nome do comercio
- Notifica apenas o comercio favoritado
- Mensagem: "[Nome do usuario] favoritou sua loja!"

**3. `notify_commerce_on_new_order`**
- Tabela: `orders` (INSERT)
- Notifica o comercio do pedido
- Mensagem diferenciada para delivery vs mesa vs balcao

**4. `notify_commerce_on_low_stock`**
- Tabela: `products` (UPDATE, quando stock muda)
- Dispara quando stock <= 5 e stock > 0
- Notifica o comercio dono do produto
- Mensagem: "[Produto] com apenas [X] unidade(s) em estoque!"

**5. `notify_commerces_on_new_system_update`**
- Tabela: `system_updates` (INSERT)
- Notifica todos os comercios aprovados
- Mensagem: inclui descricao da atualizacao

**6. `notify_commerce_on_forum_reply`**
- Tabela: `forum_replies` (INSERT)
- Verifica se o topico original foi criado por um comercio (author_type = 'commerce')
- Notifica apenas o comercio autor do topico
- Mensagem: "[Autor] respondeu ao seu topico: [titulo]"

**7. `notify_commerce_on_cash_register`**
- Tabela: `cash_registers` (INSERT para abertura, UPDATE para fechamento)
- Notifica o comercio
- Mensagem de abertura: "Caixa aberto por [operador]"
- Mensagem de fechamento: "Caixa fechado. Diferenca: R$ [valor]"

### Frontend - CommerceNotificationBell.tsx

Adicionar novos icones e rotas de navegacao:

```text
new_forum_topic  -> MessageSquare (azul)    -> secao "forum"
new_favorite     -> Heart (rosa)            -> secao "overview"
new_order        -> ShoppingCart (verde)     -> secao "orders" (ja existe icone)
low_stock        -> Package (laranja)        -> secao "stock"
new_system_update -> Settings (cinza)       -> secao "updates"
forum_reply      -> MessageSquare (roxo)    -> secao "forum"
cash_register_event -> Banknote (amarelo)   -> secao "cash-register"
```

Importar icones adicionais: `MessageSquare`, `Heart`, `Banknote` do lucide-react.

### Arquivos afetados

- **Nova migracao SQL**: 7 funcoes de trigger + 7 triggers
- **Editar**: `src/components/commerce/CommerceNotificationBell.tsx` - novos tipos de icone, navegacao e imports

