

## Mover botao "Relatorio de Estoque" do Financeiro para o Controle de Estoque

### Resumo

Remover o botao "Relatorio de Estoque" da tela Financeiro e adicioná-lo na tela Controle de Estoque, junto com toda a logica de geracao do PDF.

### Alteracoes

**1. `src/components/commerce/CommerceFinancial.tsx`**
- Remover o botao "Relatorio de Estoque" (linhas 1112-1125)
- Remover a funcao `handleGenerateStockReport` (linhas 736-798)
- Remover o estado/logica de `generatingPdf === 'estoque'` se nao houver mais uso

**2. `src/components/commerce/CommerceStockControl.tsx`**
- Adicionar import de `Download`, `Loader2` (icones) e `generateStockReportPDF` (do pdfReportGenerator)
- Adicionar estado `generatingPdf` para controlar o loading do botao
- Copiar a funcao `handleGenerateStockReport` (busca produtos, categorias, monta dados e chama `generateStockReportPDF`)
- Adicionar o botao "Relatorio de Estoque" no cabecalho da pagina de Controle de Estoque, ao lado dos botoes existentes

Nenhuma alteracao no banco de dados. Apenas movimentacao de codigo entre dois componentes.

