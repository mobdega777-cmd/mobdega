import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './formatCurrency';

interface ExpenseData {
  name: string;
  type: string;
  amount: number;
  date?: string;
}

interface FinancialDetailsData {
  grossRevenue: number;
  netRevenue: number;
  operatorFees: number;
  productCostSold: number;
  taxAmount: number;
  taxRegime: string;
  taxPaymentDay: number;
  fixedExpenses: number;
  stockPurchases: number;
  netProfit: number;
  stockValue: number;
  potentialStockProfit: number;
  projectedRevenue: number;
  businessValuation: number;
  expenses: ExpenseData[];
  stockPurchaseHistory: ExpenseData[];
}

interface SalesReportData {
  commerceName: string;
  logoUrl?: string | null;
  period: string;
  totalRevenue: number;
  totalOrders: number;
  avgTicket: number;
  profitMargin: number;
  growthRate: number;
  topCategories: { name: string; revenue: number }[];
  paymentMethodBreakdown: { method: string; total: number; count: number }[];
  dailySales: { date: string; revenue: number; orders: number }[];
  weeklySales?: { week: string; revenue: number; orders: number }[];
  financialDetails?: FinancialDetailsData;
}

interface StockReportData {
  commerceName: string;
  logoUrl?: string | null;
  period: string;
  totalProducts: number;
  stockValue: number;
  potentialRevenue: number;
  lowStockProducts: { name: string; stock: number; minStock: number }[];
  products: { name: string; category: string; stock: number; price: number; value: number }[];
  categories: { name: string; productCount: number; totalValue: number }[];
}

export const generateSalesReportPDF = async (data: SalesReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(245, 158, 11); // Primary orange
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(data.commerceName, 14, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Relatório de Vendas - ${data.period}`, 14, 35);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth - 14, 35, { align: 'right' });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Summary Section
  let yPos = 55;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo do Período', 14, yPos);
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Summary Cards
  const cardWidth = (pageWidth - 42) / 4;
  const cards = [
    { label: 'Faturamento', value: formatCurrency(data.totalRevenue), color: [16, 185, 129] },
    { label: 'Pedidos', value: data.totalOrders.toString(), color: [59, 130, 246] },
    { label: 'Ticket Médio', value: formatCurrency(data.avgTicket), color: [139, 92, 246] },
    { label: 'Crescimento', value: `${data.growthRate >= 0 ? '+' : ''}${data.growthRate.toFixed(1)}%`, color: data.growthRate >= 0 ? [16, 185, 129] : [239, 68, 68] },
  ];

  cards.forEach((card, index) => {
    const x = 14 + (cardWidth + 4) * index;
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.roundedRect(x, yPos, cardWidth, 25, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(card.label, x + cardWidth / 2, yPos + 8, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + cardWidth / 2, yPos + 18, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  });

  doc.setTextColor(0, 0, 0);
  yPos += 35;

  // Payment Methods Table
  if (data.paymentMethodBreakdown.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Vendas por Forma de Pagamento', 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Forma de Pagamento', 'Quantidade', 'Total']],
      body: data.paymentMethodBreakdown.map(pm => [
        pm.method,
        pm.count.toString(),
        formatCurrency(pm.total)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Top Categories Table
  if (data.topCategories.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Categorias Mais Vendidas', 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Categoria', 'Receita']],
      body: data.topCategories.map((cat, index) => [
        `${index + 1}. ${cat.name}`,
        formatCurrency(cat.revenue)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Daily Sales Table
  if (data.dailySales.length > 0) {
    // Check if we need a new page
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Vendas Diárias', 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Data', 'Pedidos', 'Receita']],
      body: data.dailySales.slice(0, 15).map(day => [
        day.date,
        day.orders.toString(),
        formatCurrency(day.revenue)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Weekly Sales Table
  if (data.weeklySales && data.weeklySales.length > 0) {
    // Check if we need a new page
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Vendas Semanais', 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Semana', 'Pedidos', 'Receita']],
      body: data.weeklySales.map(week => [
        week.week,
        week.orders.toString(),
        formatCurrency(week.revenue)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Sales Evolution Mini Chart (visual representation using bars)
  if (data.dailySales.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Gráfico de Evolução de Vendas', 14, yPos);
    yPos += 10;

    const chartWidth = pageWidth - 28;
    const chartHeight = 40;
    const maxRevenue = Math.max(...data.dailySales.map(d => d.revenue), 1);
    const barWidth = Math.min(chartWidth / data.dailySales.length - 2, 15);

    // Draw chart background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, yPos, chartWidth, chartHeight + 20, 3, 3, 'F');

    // Draw bars
    data.dailySales.slice(-14).forEach((day, index) => {
      const barHeight = (day.revenue / maxRevenue) * chartHeight;
      const x = 20 + (index * (barWidth + 4));
      const y = yPos + 5 + (chartHeight - barHeight);
      
      doc.setFillColor(245, 158, 11);
      doc.roundedRect(x, y, barWidth, barHeight, 1, 1, 'F');
      
      // Date label
      doc.setFontSize(6);
      doc.setTextColor(128, 128, 128);
      doc.text(day.date.slice(0, 5), x + barWidth / 2, yPos + chartHeight + 12, { align: 'center' });
    });

    doc.setTextColor(0, 0, 0);
  }

  // ========== PÁGINA 3+: DEMONSTRATIVO FINANCEIRO DETALHADO ==========
  if (data.financialDetails) {
    const fd = data.financialDetails;
    
    // Nova página para Demonstrativo de Resultado
    doc.addPage();
    yPos = 20;

    // Header da seção
    doc.setFillColor(16, 185, 129); // Green
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Demonstrativo de Resultado do Exercício (DRE)', 14, 20);
    doc.setTextColor(0, 0, 0);
    yPos = 45;

    // DRE Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Demonstrativo Financeiro Completo', 14, yPos);
    yPos += 5;

    const dreData = [
      ['(+) Faturamento Bruto', formatCurrency(fd.grossRevenue), '100%'],
      ['(-) Taxas de Operadoras', `- ${formatCurrency(fd.operatorFees)}`, `-${fd.grossRevenue > 0 ? ((fd.operatorFees / fd.grossRevenue) * 100).toFixed(1) : 0}%`],
      ['(=) Receita Líquida', formatCurrency(fd.netRevenue), `${fd.grossRevenue > 0 ? ((fd.netRevenue / fd.grossRevenue) * 100).toFixed(1) : 0}%`],
      ['(-) Custo dos Produtos Vendidos (CPV)', `- ${formatCurrency(fd.productCostSold)}`, `-${fd.grossRevenue > 0 ? ((fd.productCostSold / fd.grossRevenue) * 100).toFixed(1) : 0}%`],
      ['(=) Lucro Bruto', formatCurrency(fd.netRevenue - fd.productCostSold), `${fd.grossRevenue > 0 ? (((fd.netRevenue - fd.productCostSold) / fd.grossRevenue) * 100).toFixed(1) : 0}%`],
      ['(-) Despesas Fixas', `- ${formatCurrency(fd.fixedExpenses)}`, `-${fd.grossRevenue > 0 ? ((fd.fixedExpenses / fd.grossRevenue) * 100).toFixed(1) : 0}%`],
      ['(-) Impostos (' + getTaxRegimeLabel(fd.taxRegime) + ')', `- ${formatCurrency(fd.taxAmount)}`, `-${fd.grossRevenue > 0 ? ((fd.taxAmount / fd.grossRevenue) * 100).toFixed(1) : 0}%`],
      ['(=) LUCRO LÍQUIDO', formatCurrency(fd.netRevenue - fd.productCostSold - fd.fixedExpenses - fd.taxAmount), `${fd.grossRevenue > 0 ? (((fd.netRevenue - fd.productCostSold - fd.fixedExpenses - fd.taxAmount) / fd.grossRevenue) * 100).toFixed(1) : 0}%`],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Descrição', 'Valor', '% sobre Faturamento']],
      body: dreData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9 },
      bodyStyles: { fontStyle: 'normal' },
      didParseCell: (data) => {
        // Highlight final row
        if (data.row.index === dreData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [16, 185, 129];
          data.cell.styles.textColor = [255, 255, 255];
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 20;

    // Cards de Métricas Avançadas
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Indicadores de Performance', 14, yPos);
    yPos += 10;

    const cardWidth3 = (pageWidth - 38) / 3;
    const metricCards = [
      { label: 'Ticket Médio', value: formatCurrency(data.avgTicket), color: [139, 92, 246] },
      { label: 'Margem de Lucro', value: `${data.profitMargin.toFixed(1)}%`, color: [59, 130, 246] },
      { label: 'Taxa de Crescimento', value: `${data.growthRate >= 0 ? '+' : ''}${data.growthRate.toFixed(1)}%`, color: data.growthRate >= 0 ? [16, 185, 129] : [239, 68, 68] },
    ];

    metricCards.forEach((card, index) => {
      const x = 14 + (cardWidth3 + 4) * index;
      doc.setFillColor(card.color[0], card.color[1], card.color[2]);
      doc.roundedRect(x, yPos, cardWidth3, 25, 3, 3, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(card.label, x + cardWidth3 / 2, yPos + 8, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(card.value, x + cardWidth3 / 2, yPos + 18, { align: 'center' });
      doc.setFont('helvetica', 'normal');
    });

    doc.setTextColor(0, 0, 0);
    yPos += 40;

    // Informações sobre Impostos
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Configuração Tributária', 14, yPos);
    yPos += 10;

    doc.setFillColor(254, 243, 199); // Amber light
    doc.roundedRect(14, yPos, pageWidth - 28, 35, 3, 3, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(146, 64, 14);
    doc.text(`Regime Tributário: ${getTaxRegimeLabel(fd.taxRegime)}`, 20, yPos + 10);
    doc.text(`Valor Estimado de Imposto: ${formatCurrency(fd.taxAmount)}`, 20, yPos + 20);
    doc.text(`Dia de Pagamento (Receita Federal): Dia ${fd.taxPaymentDay} de cada mês`, 20, yPos + 30);
    
    doc.setTextColor(0, 0, 0);
    yPos += 50;

    // ========== PÁGINA 4: PROJEÇÕES E VALUATION ==========
    doc.addPage();
    yPos = 20;

    doc.setFillColor(139, 92, 246); // Purple
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Projeções e Avaliação do Negócio', 14, 20);
    doc.setTextColor(0, 0, 0);
    yPos = 45;

    // Valuation Cards
    const cardWidth2 = (pageWidth - 34) / 2;
    const valuationCards = [
      { label: 'Projeção de Faturamento Mensal', value: formatCurrency(fd.projectedRevenue), color: [59, 130, 246] },
      { label: 'Valuation do Negócio (12x Lucro)', value: formatCurrency(fd.businessValuation), color: [139, 92, 246] },
    ];

    valuationCards.forEach((card, index) => {
      const x = 14 + (cardWidth2 + 6) * index;
      doc.setFillColor(card.color[0], card.color[1], card.color[2]);
      doc.roundedRect(x, yPos, cardWidth2, 35, 3, 3, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(card.label, x + cardWidth2 / 2, yPos + 12, { align: 'center' });
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(card.value, x + cardWidth2 / 2, yPos + 26, { align: 'center' });
      doc.setFont('helvetica', 'normal');
    });

    doc.setTextColor(0, 0, 0);
    yPos += 50;

    // Estoque
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Patrimônio em Estoque', 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Descrição', 'Valor']],
      body: [
        ['Valor Total em Estoque (Custo)', formatCurrency(fd.stockValue)],
        ['Receita Potencial (Venda)', formatCurrency(fd.potentialStockProfit + fd.stockValue)],
        ['Lucro Potencial do Estoque', formatCurrency(fd.potentialStockProfit)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 20;

    // Despesas Fixas
    if (fd.expenses.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Despesas Fixas Mensais', 14, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        head: [['Despesa', 'Tipo', 'Valor Mensal']],
        body: fd.expenses.map(e => [
          e.name,
          e.type === 'fixed' ? 'Fixa' : e.type === 'variable' ? 'Variável' : e.type,
          formatCurrency(e.amount)
        ]),
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Histórico de Compras de Estoque
    if (fd.stockPurchaseHistory.length > 0) {
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Histórico de Compras de Estoque', 14, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        head: [['Data', 'Descrição', 'Valor']],
        body: fd.stockPurchaseHistory.map(e => [
          e.date || '-',
          e.name,
          formatCurrency(e.amount)
        ]),
        theme: 'striped',
        headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Resumo Executivo
    doc.addPage();
    yPos = 20;

    doc.setFillColor(59, 130, 246); // Blue
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Executivo', 14, 20);
    doc.setTextColor(0, 0, 0);
    yPos = 45;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const summaryItems = [
      `• Faturamento Bruto do Período: ${formatCurrency(fd.grossRevenue)}`,
      `• Lucro Líquido após todas as deduções: ${formatCurrency(fd.netProfit)}`,
      `• Margem de Lucro Líquida: ${fd.grossRevenue > 0 ? ((fd.netProfit / fd.grossRevenue) * 100).toFixed(1) : 0}%`,
      `• Total de Pedidos: ${data.totalOrders}`,
      `• Ticket Médio: ${formatCurrency(data.avgTicket)}`,
      `• Taxa de Crescimento: ${data.growthRate >= 0 ? '+' : ''}${data.growthRate.toFixed(1)}% em relação ao período anterior`,
      `• Impostos Estimados (${getTaxRegimeLabel(fd.taxRegime)}): ${formatCurrency(fd.taxAmount)}`,
      `• Taxas de Operadoras: ${formatCurrency(fd.operatorFees)}`,
      `• Despesas Fixas Mensais: ${formatCurrency(fd.fixedExpenses)}`,
      `• Investimento em Estoque: ${formatCurrency(fd.stockPurchases)}`,
      `• Patrimônio em Estoque: ${formatCurrency(fd.stockValue)}`,
      `• Valuation Estimado do Negócio: ${formatCurrency(fd.businessValuation)}`,
      `• Projeção de Faturamento Mensal: ${formatCurrency(fd.projectedRevenue)}`,
    ];

    summaryItems.forEach((item, index) => {
      doc.text(item, 14, yPos + (index * 10));
    });

    yPos += summaryItems.length * 10 + 20;

    // Nota final
    doc.setFillColor(240, 253, 244); // Green light
    doc.roundedRect(14, yPos, pageWidth - 28, 40, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setTextColor(22, 101, 52);
    doc.text('Nota: Este relatório foi gerado automaticamente com base nos dados registrados no sistema.', 20, yPos + 12);
    doc.text('O valuation é uma estimativa baseada em 12x o lucro líquido mensal médio projetado.', 20, yPos + 22);
    doc.text('Para decisões financeiras importantes, recomenda-se consultar um contador profissional.', 20, yPos + 32);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount} | Gerado por Mobdega`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save
  doc.save(`relatorio-vendas-${data.commerceName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
};

// Helper function for tax regime labels
const getTaxRegimeLabel = (regime: string) => {
  const labels: Record<string, string> = {
    mei: "MEI",
    simples: "Simples Nacional",
    lucro_presumido: "Lucro Presumido",
    lucro_real: "Lucro Real",
  };
  return labels[regime] || regime;
};

export const generateStockReportPDF = async (data: StockReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(139, 92, 246); // Purple
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(data.commerceName, 14, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Relatório de Estoque - ${data.period}`, 14, 35);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth - 14, 35, { align: 'right' });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Summary Section
  let yPos = 55;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo do Estoque', 14, yPos);
  
  yPos += 10;

  // Summary Cards
  const cardWidth = (pageWidth - 38) / 3;
  const cards = [
    { label: 'Total de Produtos', value: data.totalProducts.toString(), color: [59, 130, 246] },
    { label: 'Valor em Estoque', value: formatCurrency(data.stockValue), color: [139, 92, 246] },
    { label: 'Receita Potencial', value: formatCurrency(data.potentialRevenue), color: [16, 185, 129] },
  ];

  cards.forEach((card, index) => {
    const x = 14 + (cardWidth + 4) * index;
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.roundedRect(x, yPos, cardWidth, 25, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(card.label, x + cardWidth / 2, yPos + 8, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + cardWidth / 2, yPos + 18, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  });

  doc.setTextColor(0, 0, 0);
  yPos += 35;

  // Low Stock Alert
  if (data.lowStockProducts.length > 0) {
    doc.setFillColor(254, 226, 226);
    doc.roundedRect(14, yPos, pageWidth - 28, 10 + data.lowStockProducts.length * 8, 3, 3, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text('⚠️ Produtos com Estoque Baixo', 20, yPos + 8);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    data.lowStockProducts.forEach((product, index) => {
      doc.text(`• ${product.name}: ${product.stock} unidades`, 20, yPos + 16 + index * 8);
    });
    
    yPos += 15 + data.lowStockProducts.length * 8;
    doc.setTextColor(0, 0, 0);
  }

  yPos += 5;

  // Categories Summary
  if (data.categories.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Estoque por Categoria', 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Categoria', 'Produtos', 'Valor Total']],
      body: data.categories.map(cat => [
        cat.name,
        cat.productCount.toString(),
        formatCurrency(cat.totalValue)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Products Table
  if (data.products.length > 0) {
    // Check if we need a new page
    if (yPos > 180) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Lista de Produtos', 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Produto', 'Categoria', 'Estoque', 'Preço Unit.', 'Valor Total']],
      body: data.products.map(product => [
        product.name,
        product.category,
        product.stock.toString(),
        formatCurrency(product.price),
        formatCurrency(product.value)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8 },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount} | Gerado por Mobdega`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save
  doc.save(`relatorio-estoque-${data.commerceName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
};
