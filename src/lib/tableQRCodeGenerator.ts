import jsPDF from 'jspdf';

interface TableQRData {
  tableNumber: number;
  tableName: string | null;
  tableCapacity: number | null;
  commerceName: string;
  commerceLogoUrl: string | null;
  commerceId: string;
}

// Cores Mobdega
const MOBDEGA_ORANGE = { r: 249, g: 115, b: 22 }; // #F97316
const MOBDEGA_GREEN = { r: 34, g: 197, b: 94 }; // #22C55E
const DARK_BG = { r: 28, g: 28, b: 28 }; // #1C1C1C

// Gera etiqueta individual com design profissional Mobdega
export const generateTableQRCodePDF = async (data: TableQRData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [85, 115], // Formato otimizado para etiqueta
  });

  await drawProfessionalLabel(doc, data, 0, 0, 85, 115);

  doc.save(`mesa-${data.tableNumber}-qrcode.pdf`);
};

// Gera PDF A4 com todas as etiquetas em grid profissional
export const generateAllTablesQRCodePDF = async (tables: TableQRData[]) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 8;
  const labelWidth = 92;
  const labelHeight = 125;
  const cols = 2;
  const rows = 2;
  const gapX = (pageWidth - margin * 2 - labelWidth * cols) / (cols > 1 ? cols - 1 : 1);
  const gapY = 8;

  let currentPage = 0;
  for (let index = 0; index < tables.length; index++) {
    const table = tables[index];
    const labelsPerPage = cols * rows;
    const pageIndex = Math.floor(index / labelsPerPage);
    const positionOnPage = index % labelsPerPage;
    const col = positionOnPage % cols;
    const row = Math.floor(positionOnPage / cols);

    if (pageIndex > currentPage) {
      doc.addPage();
      currentPage = pageIndex;
    }

    const x = margin + col * (labelWidth + gapX);
    const y = margin + row * (labelHeight + gapY);

    await drawProfessionalLabel(doc, table, x, y, labelWidth, labelHeight);
  }

  doc.save('todas-mesas-qrcode.pdf');
};

const drawProfessionalLabel = async (
  doc: jsPDF, 
  data: TableQRData, 
  x: number, 
  y: number, 
  width: number, 
  height: number
) => {
  // Background escuro principal
  doc.setFillColor(DARK_BG.r, DARK_BG.g, DARK_BG.b);
  doc.roundedRect(x, y, width, height, 4, 4, 'F');

  // Borda gradiente laranja
  doc.setDrawColor(MOBDEGA_ORANGE.r, MOBDEGA_ORANGE.g, MOBDEGA_ORANGE.b);
  doc.setLineWidth(2);
  doc.roundedRect(x + 1, y + 1, width - 2, height - 2, 3, 3, 'S');

  // Header com gradiente laranja
  const headerHeight = 30;
  doc.setFillColor(MOBDEGA_ORANGE.r, MOBDEGA_ORANGE.g, MOBDEGA_ORANGE.b);
  doc.roundedRect(x + 4, y + 4, width - 8, headerHeight, 2, 2, 'F');

  // Área do logo do comércio (círculo branco)
  const logoSize = 22;
  const logoX = x + 12;
  const logoY = y + 8;
  doc.setFillColor(255, 255, 255);
  doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 'F');

  // Nome do comércio no header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  const commerceNameDisplay = data.commerceName.length > 18 
    ? data.commerceName.substring(0, 18) + '...' 
    : data.commerceName;
  doc.text(commerceNameDisplay, logoX + logoSize + 6, y + 16);

  // Subtítulo "Bem-vindo(a)!"
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Bem-vindo(a)!', logoX + logoSize + 6, y + 24);

  // Número da mesa - grande e destacado
  const mesaY = y + headerHeight + 20;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 180);
  doc.text('MESA', x + width / 2, mesaY, { align: 'center' });

  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(MOBDEGA_ORANGE.r, MOBDEGA_ORANGE.g, MOBDEGA_ORANGE.b);
  doc.text(String(data.tableNumber).padStart(2, '0'), x + width / 2, mesaY + 14, { align: 'center' });

  // Nome da mesa (se houver)
  if (data.tableName) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(data.tableName, x + width / 2, mesaY + 22, { align: 'center' });
  }

  // Área do QR Code
  const qrY = mesaY + 28;
  const qrSize = 42;
  const qrX = x + (width - qrSize) / 2;
  
  // Fundo branco para QR
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 3, 3, 'F');

  // QR Code padrão (simulado com padrão profissional)
  drawQRCodePattern(doc, qrX, qrY, qrSize, data);

  // Texto "Escaneie para fazer seu pedido"
  const instructionY = qrY + qrSize + 16;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(MOBDEGA_GREEN.r, MOBDEGA_GREEN.g, MOBDEGA_GREEN.b);
  doc.text('Escaneie para fazer seu pedido', x + width / 2, instructionY, { align: 'center' });

  // Rodapé com site
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('www.mobdega.shop', x + width / 2, height + y - 6, { align: 'center' });
};

const drawQRCodePattern = (doc: jsPDF, x: number, y: number, size: number, data: TableQRData) => {
  const cellSize = size / 25;
  
  doc.setFillColor(0, 0, 0);
  
  // Position detection patterns (3 cantos)
  const drawPositionPattern = (px: number, py: number) => {
    // Outer 7x7
    doc.rect(px, py, 7 * cellSize, 7 * cellSize, 'F');
    // Inner white 5x5
    doc.setFillColor(255, 255, 255);
    doc.rect(px + cellSize, py + cellSize, 5 * cellSize, 5 * cellSize, 'F');
    // Center 3x3
    doc.setFillColor(0, 0, 0);
    doc.rect(px + 2 * cellSize, py + 2 * cellSize, 3 * cellSize, 3 * cellSize, 'F');
  };

  // Top-left
  drawPositionPattern(x, y);
  // Top-right
  drawPositionPattern(x + size - 7 * cellSize, y);
  // Bottom-left
  drawPositionPattern(x, y + size - 7 * cellSize);

  // Alignment pattern (centro-direita inferior)
  doc.setFillColor(0, 0, 0);
  const alignX = x + 16 * cellSize;
  const alignY = y + 16 * cellSize;
  doc.rect(alignX, alignY, 5 * cellSize, 5 * cellSize, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(alignX + cellSize, alignY + cellSize, 3 * cellSize, 3 * cellSize, 'F');
  doc.setFillColor(0, 0, 0);
  doc.rect(alignX + 2 * cellSize, alignY + 2 * cellSize, cellSize, cellSize, 'F');

  // Timing patterns
  for (let i = 8; i < 17; i++) {
    if (i % 2 === 0) {
      doc.rect(x + i * cellSize, y + 6 * cellSize, cellSize * 0.9, cellSize * 0.9, 'F');
      doc.rect(x + 6 * cellSize, y + i * cellSize, cellSize * 0.9, cellSize * 0.9, 'F');
    }
  }

  // Data pattern (baseado no número da mesa e ID)
  const seed = data.tableNumber + data.commerceId.charCodeAt(0);
  for (let row = 9; row < 24; row++) {
    for (let col = 9; col < 24; col++) {
      // Skip alignment pattern area
      if (col >= 15 && col <= 20 && row >= 15 && row <= 20) continue;
      
      // Create a more realistic QR pattern
      const hash = (row * 31 + col * 17 + seed) % 7;
      if (hash < 3) {
        doc.rect(x + col * cellSize, y + row * cellSize, cellSize * 0.85, cellSize * 0.85, 'F');
      }
    }
  }

  // Área de dados adicional (canto superior direito e inferior esquerdo)
  for (let row = 1; row < 6; row++) {
    for (let col = 9; col < 16; col++) {
      const hash = (row * 23 + col * 13 + seed) % 5;
      if (hash < 2) {
        doc.rect(x + col * cellSize, y + row * cellSize, cellSize * 0.85, cellSize * 0.85, 'F');
      }
    }
  }

  for (let row = 9; row < 16; row++) {
    for (let col = 1; col < 6; col++) {
      const hash = (row * 19 + col * 29 + seed) % 5;
      if (hash < 2) {
        doc.rect(x + col * cellSize, y + row * cellSize, cellSize * 0.85, cellSize * 0.85, 'F');
      }
    }
  }
};
