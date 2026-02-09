
# Plano: Relatorio Gerencial Completo (PDF)

## Resumo

Criar um botao "Relatorio Gerencial" na barra de botoes do Financeiro (ao lado de "Relatorio de Estoque") que gera um PDF completo com dados de **todos os modulos** do sistema: vendas, caixa, estoque, despesas, clientes, cupons, delivery, ranking e insights de BI.

---

## O que o relatorio vai conter

O PDF sera organizado em secoes com headers coloridos, seguindo o padrao visual ja existente nos relatorios de vendas e estoque:

### Pagina 1 -- Capa + Resumo Executivo
- Nome do comercio, periodo, data de geracao
- Cards resumo: Faturamento, Pedidos, Ticket Medio, Crescimento, Lucro Liquido, Valuation

### Pagina 2 -- DRE (Demonstrativo de Resultado)
- Tabela completa: Faturamento Bruto, Taxas, Receita Liquida, CPV, Lucro Bruto, Despesas Fixas, Impostos, Lucro Liquido
- Reutiliza a mesma logica ja presente no relatorio de vendas

### Pagina 3 -- Vendas Detalhadas
- Vendas por forma de pagamento (tabela)
- Categorias mais vendidas (tabela)
- Vendas diarias do periodo (tabela)

### Pagina 4 -- Fechamentos de Caixa
- Ultimos fechamentos: data abertura/fechamento, saldo esperado vs real, diferenca, faturamento, ticket medio, metodo mais usado, duracao, status

### Pagina 5 -- Estoque
- Cards: Total produtos, Valor em estoque, Receita potencial
- Produtos com estoque baixo (alerta)
- Estoque por categoria (tabela)

### Pagina 6 -- Despesas e Custos
- Lista de despesas fixas e variaveis com status (pago/pendente)
- Historico de compras de estoque
- Configuracao tributaria

### Pagina 7 -- Clientes (CRM)
- Total de clientes, novos vs recorrentes
- Top 10 clientes por gasto total

### Pagina 8 -- Cupons
- Cupons ativos: codigo, tipo desconto, usos, validade

### Pagina 9 -- Delivery
- Total pedidos delivery no periodo, valor total
- Resumo de status (pendentes, em rota, entregues)

### Pagina 10 -- Insights e BI
- Ticket Medio e variacao
- Horario e dia de pico
- Produto mais vendido
- Taxa de retencao de clientes
- Dicas de marketing baseadas nos dados

### Pagina 11 -- Ranking
- Posicao atual do comercio nas categorias (Ouro, Top Delivery, Gestao 10)
- Nota e avaliacoes

### Pagina Final -- Projecoes e Valuation
- Projecao de faturamento mensal
- Valuation do negocio (12x lucro)
- Nota explicativa de metodologia

---

## Mudancas Tecnicas

### Arquivo: `src/lib/pdfReportGenerator.ts`

Criar nova funcao exportada `generateManagementReportPDF` que recebe uma interface `ManagementReportData` com todos os dados necessarios. A funcao seguira o mesmo padrao visual dos relatorios existentes (jsPDF + autoTable, headers coloridos, cards).

**Nova interface:**
```text
ManagementReportData {
  commerceName, logoUrl, period
  // Financeiro
  grossRevenue, netRevenue, operatorFees, productCostSold
  taxAmount, taxRegime, taxPaymentDay, fixedExpenses
  netProfit, projectedRevenue, businessValuation
  totalOrders, avgTicket, growthRate, profitMargin
  // Vendas
  paymentMethodBreakdown, topCategories, dailySales
  // Caixa
  cashClosings: { openedAt, closedAt, openingAmount, closingAmount, expectedAmount, difference, totalSales, salesCount, ticketMedio, topPaymentMethod, durationMinutes }[]
  // Estoque
  totalProducts, stockValue, potentialRevenue
  lowStockProducts, productsByCategory
  // Despesas
  expenses (fixas/variaveis com status pago)
  stockPurchaseHistory
  // Clientes
  totalCustomers, newCustomers, returningCustomers, topCustomers
  // Cupons
  activeCoupons
  // Delivery
  deliveryStats: { total, delivered, pending, inRoute, totalValue }
  // Insights
  peakHour, peakDay, topProduct, retentionRate
  // Ranking
  rankingPosition, avgRating, reviewCount, favoritesCount
}
```

### Arquivo: `src/components/commerce/CommerceFinancial.tsx`

- Adicionar funcao `handleGenerateManagementReport` que busca dados de todas as tabelas relevantes (cash_registers, products, expenses, customers via orders, coupons, orders delivery, reviews, favorites, ranking data)
- Adicionar botao "Relatorio Gerencial" na barra de botoes, ao lado de "Relatorio de Estoque"
- Reutilizar o estado `generatingPdf` com valor `'gerencial'`

**Queries necessarias na funcao:**
1. `cash_registers` -- fechamentos do periodo
2. `cash_movements` -- vendas por caixa
3. `products` + `categories` -- estoque
4. `expenses` -- despesas com status
5. `orders` -- pedidos delivery
6. `order_items` -- itens vendidos por categoria
7. `coupons` -- cupons ativos
8. `reviews` -- avaliacoes
9. `favorites` -- favoritos
10. `payment_methods` -- taxas
11. `profiles` via orders -- clientes

### Arquivos modificados:
- `src/lib/pdfReportGenerator.ts` -- nova funcao `generateManagementReportPDF`
- `src/components/commerce/CommerceFinancial.tsx` -- botao + funcao de coleta de dados
