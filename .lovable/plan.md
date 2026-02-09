
# Reformulacao da Tela de Faturas - Master Admin

## O que muda

Substituir o layout atual (card de "Configurar Fatura Automatica por Comercio" com botoes + tabela de faturas) por uma **unica tabela de comercios** com todas as configuracoes e informacoes inline, 10 itens por pagina.

## Remocoes
- Botao "Gerar Faturas do Mes" do topo
- Card "Configurar Fatura Automatica por Comercio" (os botoes laranja)

## Nova Tabela de Comercios

A tabela principal listara todos os comercios aprovados com as seguintes colunas:

| Coluna | Dados | Tipo |
|---|---|---|
| Nome | `fantasy_name` | Texto |
| Bairro | `neighborhood` | Texto |
| Cidade | `city` | Texto |
| Proprietario | `owner_name` | Texto |
| Cadastro | `created_at` | Data formatada dd/mm/yyyy |
| Vencimento | `payment_due_day` | Seletor editavel (1-31) - dia do vencimento da fatura |
| Emissao | `auto_invoice_day` | Seletor editavel (1-31) - dia em que a fatura deve ser gerada |
| Pendentes | Contagem de faturas com status `pending` | Badge numerico |
| Pagas | Contagem de faturas com status `paid` | Badge numerico |
| Acao | Botao "Enviar Fatura" | Botao que gera/envia fatura manual para aquele comercio |

## Comportamento

- Os campos Vencimento e Emissao serao selects inline que ao mudar salvam automaticamente no banco (`payment_due_day` e `auto_invoice_day`)
- O botao "Enviar Fatura" ao final de cada linha abre o dialog existente de "Nova Fatura" pre-preenchido com o comercio daquela linha
- Paginacao de 10 itens por pagina (ja existente)
- Busca por nome do comercio (reutilizar filtro existente)
- Manter o botao "+ Nova Fatura" no topo
- Contagens de pendentes/pagas serao calculadas a partir dos dados de invoices ja carregados

## Detalhes Tecnicos

**Arquivo:** `src/components/admin/AdminInvoices.tsx`

**Mudancas principais:**
1. Ampliar o `fetchCommerces` para incluir `neighborhood, city, owner_name, created_at, payment_due_day` nos campos do select
2. Remover as linhas 343-346 (botao "Gerar Faturas do Mes")
3. Remover as linhas 354-390 (card de configuracao automatica)
4. Substituir a tabela de faturas (linhas 440-508) por uma tabela de comercios com as novas colunas
5. Adicionar funcao para salvar `payment_due_day` e `auto_invoice_day` inline via update no Supabase
6. Calcular contagens de faturas pendentes/pagas por comercio a partir dos dados ja carregados em `invoices`
7. O botao "Enviar Fatura" pre-preenche `newInvoice.commerce_id` e abre o `createDialogOpen`

A tabela de faturas detalhada existente (com status, valor, etc.) sera removida da visao principal, pois a nova visao foca nos comercios. Caso necessario no futuro, podera ser acessada via clique no comercio.
