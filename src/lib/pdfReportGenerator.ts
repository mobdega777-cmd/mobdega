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
    // Ensure enough space for chart (~80px needed), otherwise new page
    if (yPos > 180) {
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

    // Explicação do cálculo
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    const maxTextWidth = pageWidth - 28;
    const explanationLines = [
      'Como é calculado: A Projeção de Faturamento Mensal é baseada na média diária de vendas do período multiplicada por 30 dias.',
      'O Valuation do Negócio utiliza o método de múltiplo de lucro: Lucro Líquido Mensal Projetado × 12 meses.',
      'Lucro Líquido = Faturamento Projetado − Custos (fixos + variáveis + taxas de operadoras + impostos).',
    ];
    explanationLines.forEach((line) => {
      const splitLines = doc.splitTextToSize(line, maxTextWidth);
      doc.text(splitLines, 14, yPos);
      yPos += splitLines.length * 4;
    });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    yPos += 6;

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

// ============= MANAGEMENT REPORT =============

export interface ManagementReportData {
  commerceName: string;
  logoUrl?: string | null;
  period: string;
  // Financial
  grossRevenue: number;
  netRevenue: number;
  operatorFees: number;
  productCostSold: number;
  taxAmount: number;
  taxRegime: string;
  taxPaymentDay: number;
  fixedExpenses: number;
  netProfit: number;
  projectedRevenue: number;
  businessValuation: number;
  totalOrders: number;
  avgTicket: number;
  growthRate: number;
  profitMargin: number;
  // Sales
  paymentMethodBreakdown: { method: string; total: number; count: number }[];
  topCategories: { name: string; revenue: number }[];
  dailySales: { date: string; revenue: number; orders: number }[];
  // Cash
  cashClosings: {
    openedAt: string;
    closedAt: string;
    openingAmount: number;
    closingAmount: number;
    expectedAmount: number;
    difference: number;
    totalSales: number;
    salesCount: number;
    ticketMedio: number;
    topPaymentMethod: string;
    durationMinutes: number;
    status: string;
  }[];
  // Stock
  totalProducts: number;
  stockValue: number;
  potentialRevenue: number;
  lowStockProducts: { name: string; stock: number }[];
  productsByCategory: { name: string; productCount: number; totalValue: number }[];
  // Expenses
  expenses: { name: string; type: string; amount: number; isPaid: boolean; dueDate?: string }[];
  stockPurchaseHistory: { name: string; amount: number; date: string }[];
  // CRM
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  topCustomers: { name: string; totalSpent: number; orderCount: number }[];
  // Coupons
  activeCoupons: { code: string; discountType: string; discountValue: number; usedCount: number; maxUses: number | null; validUntil: string | null }[];
  // Delivery
  deliveryStats: { total: number; delivered: number; pending: number; inRoute: number; totalValue: number };
  // Insights
  peakHour: string;
  peakDay: string;
  topProduct: string;
  retentionRate: number;
}

const mgmtSectionHeader = (doc: jsPDF, title: string, color: number[]) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 20);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
};

const mgmtCards = (doc: jsPDF, yPos: number, cards: { label: string; value: string; color: number[] }[], count: number = 4) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const gap = 4;
  const cardWidth = (pageWidth - 28 - (count - 1) * gap) / count;
  cards.forEach((card, index) => {
    const x = 14 + (cardWidth + gap) * index;
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.roundedRect(x, yPos, cardWidth, 25, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text(card.label, x + cardWidth / 2, yPos + 8, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + cardWidth / 2, yPos + 18, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  });
  doc.setTextColor(0, 0, 0);
  return yPos + 30;
};

const checkPageBreak = (doc: jsPDF, yPos: number, needed: number = 40): number => {
  if (yPos + needed > doc.internal.pageSize.getHeight() - 20) {
    doc.addPage();
    return 20;
  }
  return yPos;
};

export const generateManagementReportPDF = async (data: ManagementReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos: number;

  // ===== PAGE 1: COVER + EXECUTIVE SUMMARY =====
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 0, pageWidth, 50, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório Gerencial', 14, 30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(data.commerceName, 14, 42);
  doc.text(`Período: ${data.period}`, pageWidth - 14, 42, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  yPos = 65;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo Executivo', 14, yPos);
  yPos += 10;

  yPos = mgmtCards(doc, yPos, [
    { label: 'Faturamento Bruto', value: formatCurrency(data.grossRevenue), color: [16, 185, 129] },
    { label: 'Pedidos', value: data.totalOrders.toString(), color: [59, 130, 246] },
    { label: 'Ticket Médio', value: formatCurrency(data.avgTicket), color: [139, 92, 246] },
    { label: 'Crescimento', value: `${data.growthRate >= 0 ? '+' : ''}${data.growthRate.toFixed(1)}%`, color: data.growthRate >= 0 ? [16, 185, 129] : [239, 68, 68] },
  ]);

  yPos += 5;
  yPos = mgmtCards(doc, yPos, [
    { label: 'Lucro Líquido', value: formatCurrency(data.netProfit), color: data.netProfit >= 0 ? [16, 185, 129] : [239, 68, 68] },
    { label: 'Margem de Lucro', value: `${data.profitMargin.toFixed(1)}%`, color: [59, 130, 246] },
    { label: 'Projeção Mensal', value: formatCurrency(data.projectedRevenue), color: [139, 92, 246] },
    { label: 'Valuation', value: formatCurrency(data.businessValuation), color: [245, 158, 11] },
  ]);

  // ===== PAGE 2: DRE =====
  doc.addPage();
  mgmtSectionHeader(doc, 'Demonstrativo de Resultado (DRE)', [16, 185, 129]);
  yPos = 45;

  const dreData = [
    ['(+) Faturamento Bruto', formatCurrency(data.grossRevenue), '100%'],
    ['(-) Taxas de Operadoras', `- ${formatCurrency(data.operatorFees)}`, `-${data.grossRevenue > 0 ? ((data.operatorFees / data.grossRevenue) * 100).toFixed(1) : '0'}%`],
    ['(=) Receita Líquida', formatCurrency(data.netRevenue), `${data.grossRevenue > 0 ? ((data.netRevenue / data.grossRevenue) * 100).toFixed(1) : '0'}%`],
    ['(-) CPV (Custo Produtos Vendidos)', `- ${formatCurrency(data.productCostSold)}`, `-${data.grossRevenue > 0 ? ((data.productCostSold / data.grossRevenue) * 100).toFixed(1) : '0'}%`],
    ['(=) Lucro Bruto', formatCurrency(data.netRevenue - data.productCostSold), `${data.grossRevenue > 0 ? (((data.netRevenue - data.productCostSold) / data.grossRevenue) * 100).toFixed(1) : '0'}%`],
    ['(-) Despesas Fixas', `- ${formatCurrency(data.fixedExpenses)}`, `-${data.grossRevenue > 0 ? ((data.fixedExpenses / data.grossRevenue) * 100).toFixed(1) : '0'}%`],
    ['(-) Impostos (' + getTaxRegimeLabel(data.taxRegime) + ')', `- ${formatCurrency(data.taxAmount)}`, `-${data.grossRevenue > 0 ? ((data.taxAmount / data.grossRevenue) * 100).toFixed(1) : '0'}%`],
    ['(=) LUCRO LÍQUIDO', formatCurrency(data.netProfit), `${data.grossRevenue > 0 ? ((data.netProfit / data.grossRevenue) * 100).toFixed(1) : '0'}%`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Descrição', 'Valor', '% Faturamento']],
    body: dreData,
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9 },
    didParseCell: (hookData) => {
      if (hookData.row.index === dreData.length - 1) {
        hookData.cell.styles.fontStyle = 'bold';
        hookData.cell.styles.fillColor = [16, 185, 129];
        hookData.cell.styles.textColor = [255, 255, 255];
      }
    },
  });

  // ===== PAGE 3: DETAILED SALES =====
  doc.addPage();
  mgmtSectionHeader(doc, 'Vendas Detalhadas', [245, 158, 11]);
  yPos = 45;

  if (data.paymentMethodBreakdown.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Vendas por Forma de Pagamento', 14, yPos);
    yPos += 5;
    autoTable(doc, {
      startY: yPos,
      head: [['Forma de Pagamento', 'Qtd', 'Total']],
      body: data.paymentMethodBreakdown.map(pm => [pm.method, pm.count.toString(), formatCurrency(pm.total)]),
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  if (data.topCategories.length > 0) {
    yPos = checkPageBreak(doc, yPos, 60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Categorias Mais Vendidas', 14, yPos);
    yPos += 5;
    autoTable(doc, {
      startY: yPos,
      head: [['Categoria', 'Receita']],
      body: data.topCategories.map((cat, i) => [`${i + 1}. ${cat.name}`, formatCurrency(cat.revenue)]),
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  if (data.dailySales.length > 0) {
    yPos = checkPageBreak(doc, yPos, 60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Vendas Diárias', 14, yPos);
    yPos += 5;
    autoTable(doc, {
      startY: yPos,
      head: [['Data', 'Pedidos', 'Receita']],
      body: data.dailySales.slice(0, 20).map(d => [d.date, d.orders.toString(), formatCurrency(d.revenue)]),
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // ===== PAGE 4: CASH CLOSINGS =====
  if (data.cashClosings.length > 0) {
    doc.addPage();
    mgmtSectionHeader(doc, 'Fechamentos de Caixa', [59, 130, 246]);
    yPos = 45;

    autoTable(doc, {
      startY: yPos,
      head: [['Abertura', 'Fechamento', 'Esperado', 'Real', 'Diferença', 'Vendas', 'Status']],
      body: data.cashClosings.map(c => [
        c.openedAt,
        c.closedAt,
        formatCurrency(c.expectedAmount),
        formatCurrency(c.closingAmount),
        formatCurrency(c.difference),
        `${c.salesCount} (${formatCurrency(c.totalSales)})`,
        c.status === 'closed' ? 'Fechado' : 'Aberto',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 7 },
      columnStyles: { 0: { cellWidth: 24 }, 1: { cellWidth: 24 } },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Cash summary cards
    const totalCashSales = data.cashClosings.reduce((s, c) => s + c.totalSales, 0);
    const totalDiff = data.cashClosings.reduce((s, c) => s + c.difference, 0);
    const avgCashTicket = data.cashClosings.reduce((s, c) => s + c.ticketMedio, 0) / data.cashClosings.length;
    yPos = checkPageBreak(doc, yPos, 40);
    yPos = mgmtCards(doc, yPos, [
      { label: 'Total Vendas Caixa', value: formatCurrency(totalCashSales), color: [59, 130, 246] },
      { label: 'Diferença Total', value: formatCurrency(totalDiff), color: totalDiff >= 0 ? [16, 185, 129] : [239, 68, 68] },
      { label: 'Ticket Médio Caixa', value: formatCurrency(avgCashTicket), color: [139, 92, 246] },
    ], 3);
  }

  // ===== PAGE 5: STOCK =====
  doc.addPage();
  mgmtSectionHeader(doc, 'Estoque', [139, 92, 246]);
  yPos = 45;

  yPos = mgmtCards(doc, yPos, [
    { label: 'Total Produtos', value: data.totalProducts.toString(), color: [59, 130, 246] },
    { label: 'Valor em Estoque', value: formatCurrency(data.stockValue), color: [139, 92, 246] },
    { label: 'Receita Potencial', value: formatCurrency(data.potentialRevenue), color: [16, 185, 129] },
  ], 3);

  if (data.lowStockProducts.length > 0) {
    yPos += 5;
    doc.setFillColor(254, 226, 226);
    const alertH = Math.min(10 + data.lowStockProducts.length * 8, 60);
    doc.roundedRect(14, yPos, pageWidth - 28, alertH, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text('⚠️ Estoque Baixo', 20, yPos + 8);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    data.lowStockProducts.slice(0, 6).forEach((p, i) => {
      doc.text(`• ${p.name}: ${p.stock} un`, 20, yPos + 16 + i * 7);
    });
    doc.setTextColor(0, 0, 0);
    yPos += alertH + 10;
  }

  if (data.productsByCategory.length > 0) {
    yPos = checkPageBreak(doc, yPos, 50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Estoque por Categoria', 14, yPos);
    yPos += 5;
    autoTable(doc, {
      startY: yPos,
      head: [['Categoria', 'Produtos', 'Valor Total']],
      body: data.productsByCategory.map(c => [c.name, c.productCount.toString(), formatCurrency(c.totalValue)]),
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // ===== PAGE 6: EXPENSES =====
  doc.addPage();
  mgmtSectionHeader(doc, 'Despesas e Custos', [239, 68, 68]);
  yPos = 45;

  if (data.expenses.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Despesas Fixas e Variáveis', 14, yPos);
    yPos += 5;
    autoTable(doc, {
      startY: yPos,
      head: [['Despesa', 'Tipo', 'Valor', 'Status', 'Vencimento']],
      body: data.expenses.map(e => [
        e.name,
        e.type === 'fixed' ? 'Fixa' : e.type === 'variable' ? 'Variável' : e.type === 'stock_purchase' ? 'Compra Estoque' : e.type,
        formatCurrency(e.amount),
        e.isPaid ? '✅ Pago' : '⏳ Pendente',
        e.dueDate || '-',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  if (data.stockPurchaseHistory.length > 0) {
    yPos = checkPageBreak(doc, yPos, 50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Histórico de Compras de Estoque', 14, yPos);
    yPos += 5;
    autoTable(doc, {
      startY: yPos,
      head: [['Data', 'Descrição', 'Valor']],
      body: data.stockPurchaseHistory.map(e => [e.date, e.name, formatCurrency(e.amount)]),
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Tax config info
  yPos = checkPageBreak(doc, yPos, 50);
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(14, yPos, pageWidth - 28, 25, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setTextColor(146, 64, 14);
  doc.text(`Regime Tributário: ${getTaxRegimeLabel(data.taxRegime)}`, 20, yPos + 10);
  doc.text(`Imposto Estimado: ${formatCurrency(data.taxAmount)} | Dia Pgto: ${data.taxPaymentDay}`, 20, yPos + 20);
  doc.setTextColor(0, 0, 0);

  // ===== PAGE 7: CRM =====
  doc.addPage();
  mgmtSectionHeader(doc, 'Clientes (CRM)', [16, 185, 129]);
  yPos = 45;

  yPos = mgmtCards(doc, yPos, [
    { label: 'Total Clientes', value: data.totalCustomers.toString(), color: [59, 130, 246] },
    { label: 'Novos', value: data.newCustomers.toString(), color: [16, 185, 129] },
    { label: 'Recorrentes', value: data.returningCustomers.toString(), color: [139, 92, 246] },
    { label: 'Retenção', value: `${data.retentionRate.toFixed(1)}%`, color: [245, 158, 11] },
  ]);

  if (data.topCustomers.length > 0) {
    yPos += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Top 10 Clientes por Gasto', 14, yPos);
    yPos += 5;
    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Cliente', 'Pedidos', 'Total Gasto']],
      body: data.topCustomers.map((c, i) => [(i + 1).toString(), c.name, c.orderCount.toString(), formatCurrency(c.totalSpent)]),
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // ===== PAGE 8: COUPONS =====
  if (data.activeCoupons.length > 0) {
    doc.addPage();
    mgmtSectionHeader(doc, 'Cupons Ativos', [245, 158, 11]);
    yPos = 45;

    autoTable(doc, {
      startY: yPos,
      head: [['Código', 'Tipo', 'Desconto', 'Usos', 'Validade']],
      body: data.activeCoupons.map(c => [
        c.code,
        c.discountType === 'percentage' ? 'Percentual' : 'Fixo',
        c.discountType === 'percentage' ? `${c.discountValue}%` : formatCurrency(c.discountValue),
        `${c.usedCount}${c.maxUses ? `/${c.maxUses}` : ''}`,
        c.validUntil || 'Sem limite',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9 },
    });
  }

  // ===== PAGE 9: DELIVERY =====
  doc.addPage();
  mgmtSectionHeader(doc, 'Delivery', [59, 130, 246]);
  yPos = 45;

  yPos = mgmtCards(doc, yPos, [
    { label: 'Total Pedidos', value: data.deliveryStats.total.toString(), color: [59, 130, 246] },
    { label: 'Entregues', value: data.deliveryStats.delivered.toString(), color: [16, 185, 129] },
    { label: 'Pendentes', value: data.deliveryStats.pending.toString(), color: [245, 158, 11] },
    { label: 'Valor Total', value: formatCurrency(data.deliveryStats.totalValue), color: [139, 92, 246] },
  ]);

  // ===== PAGE 10: INSIGHTS =====
  doc.addPage();
  mgmtSectionHeader(doc, 'Insights e Business Intelligence', [139, 92, 246]);
  yPos = 45;

  yPos = mgmtCards(doc, yPos, [
    { label: 'Ticket Médio', value: formatCurrency(data.avgTicket), color: [59, 130, 246] },
    { label: 'Horário de Pico', value: data.peakHour || '-', color: [245, 158, 11] },
    { label: 'Dia de Pico', value: data.peakDay || '-', color: [16, 185, 129] },
    { label: 'Produto Top', value: (data.topProduct || '-').substring(0, 18), color: [139, 92, 246] },
  ]);

  yPos += 5;
  yPos = mgmtCards(doc, yPos, [
    { label: 'Retenção Clientes', value: `${data.retentionRate.toFixed(1)}%`, color: [16, 185, 129] },
    { label: 'Avaliação Média', value: `${data.avgRating.toFixed(1)} ⭐`, color: [245, 158, 11] },
    { label: 'Avaliações', value: data.reviewCount.toString(), color: [59, 130, 246] },
    { label: 'Favoritos', value: data.favoritesCount.toString(), color: [239, 68, 68] },
  ]);

  // BI Tips
  yPos += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('📊 Dicas de Marketing Baseadas nos Dados', 14, yPos);
  yPos += 10;

  doc.setFillColor(240, 253, 244);
  const tips: string[] = [];
  if (data.peakHour) tips.push(`• Seu horário de pico é ${data.peakHour}. Invista em promoções relâmpago nesse horário.`);
  if (data.peakDay) tips.push(`• ${data.peakDay} é seu dia mais forte. Considere promoções em dias fracos para equilibrar.`);
  if (data.retentionRate < 30) tips.push('• Retenção abaixo de 30%. Crie programas de fidelidade para trazer clientes de volta.');
  if (data.retentionRate >= 30) tips.push(`• Retenção de ${data.retentionRate.toFixed(0)}%! Continue investindo em experiência do cliente.`);
  if (data.avgRating < 4) tips.push('• Nota abaixo de 4.0. Foque em qualidade do serviço e resolução de problemas.');
  if (data.avgRating >= 4) tips.push(`• Nota ${data.avgRating.toFixed(1)}! Use avaliações positivas como prova social nas redes.`);
  if (data.topProduct) tips.push(`• "${data.topProduct}" é seu carro-chefe. Crie combos com ele para aumentar ticket médio.`);
  if (data.growthRate < 0) tips.push('• Vendas em queda. Revise precificação, invista em marketing e avalie novos canais.');
  if (data.growthRate > 10) tips.push(`• Crescimento de ${data.growthRate.toFixed(0)}%! Considere expandir equipe ou horário.`);

  const tipsHeight = tips.length * 10 + 10;
  doc.roundedRect(14, yPos, pageWidth - 28, tipsHeight, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'normal');
  tips.forEach((tip, i) => {
    const splitTip = doc.splitTextToSize(tip, pageWidth - 40);
    doc.text(splitTip, 20, yPos + 8 + i * 10);
  });
  doc.setTextColor(0, 0, 0);

  // ===== PAGE 11: RANKING =====
  doc.addPage();
  mgmtSectionHeader(doc, 'Ranking e Avaliações', [245, 158, 11]);
  yPos = 45;

  yPos = mgmtCards(doc, yPos, [
    { label: 'Nota Média', value: `${data.avgRating.toFixed(1)} ⭐`, color: [245, 158, 11] },
    { label: 'Total Avaliações', value: data.reviewCount.toString(), color: [59, 130, 246] },
    { label: 'Favoritos', value: data.favoritesCount.toString(), color: [239, 68, 68] },
  ], 3);

  // ===== FINAL PAGE: PROJECTIONS =====
  doc.addPage();
  mgmtSectionHeader(doc, 'Projeções e Valuation', [139, 92, 246]);
  yPos = 45;

  const cardWidth2 = (pageWidth - 34) / 2;
  const valuationCards = [
    { label: 'Projeção Faturamento Mensal', value: formatCurrency(data.projectedRevenue), color: [59, 130, 246] },
    { label: 'Valuation (12x Lucro)', value: formatCurrency(data.businessValuation), color: [139, 92, 246] },
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

  // Methodology
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'italic');
  const maxTxtW = pageWidth - 28;
  const methodLines = [
    'Metodologia: Projeção de Faturamento = Média diária de vendas do período × 30 dias.',
    'Valuation = Lucro Líquido Mensal Projetado × 12. Lucro = Faturamento − Taxas − CPV − Despesas − Impostos.',
    'Os dados são baseados em registros do sistema. Para decisões estratégicas, consulte um profissional.',
  ];
  methodLines.forEach(line => {
    const split = doc.splitTextToSize(line, maxTxtW);
    doc.text(split, 14, yPos);
    yPos += split.length * 4;
  });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  // Final note
  yPos += 10;
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, yPos, pageWidth - 28, 30, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setTextColor(22, 101, 52);
  doc.text('Este relatório gerencial foi gerado automaticamente pelo Mobdega.', 20, yPos + 10);
  doc.text(`Data de geração: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, yPos + 20);
  doc.setTextColor(0, 0, 0);

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount} | Relatório Gerencial - ${data.commerceName} | Mobdega`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`relatorio-gerencial-${data.commerceName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
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
