import jsPDF from 'jspdf';

interface TableQRData {
  tableNumber: number;
  tableName: string | null;
  tableCapacity: number | null;
  commerceName: string;
  commerceLogoUrl: string | null;
  commerceId: string;
}

// Gera etiqueta horizontal conforme mockup
export const generateTableQRCodePDF = async (data: TableQRData) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [100, 60], // Etiqueta horizontal
  });

  drawTableLabel(doc, data, 0, 0);

  doc.save(`mesa-${data.tableNumber}-qrcode.pdf`);
};

// Gera PDF A4 com todas as etiquetas
export const generateAllTablesQRCodePDF = async (tables: TableQRData[]) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const labelWidth = 90;
  const labelHeight = 50;
  const cols = 2;
  const rows = 5;
  const gapX = (pageWidth - margin * 2 - labelWidth * cols) / (cols - 1);
  const gapY = (pageHeight - margin * 2 - labelHeight * rows) / (rows - 1);

  let currentPage = 0;
  tables.forEach((table, index) => {
    const pageIndex = Math.floor(index / (cols * rows));
    const positionOnPage = index % (cols * rows);
    const col = positionOnPage % cols;
    const row = Math.floor(positionOnPage / cols);

    if (pageIndex > currentPage) {
      doc.addPage();
      currentPage = pageIndex;
    }

    const x = margin + col * (labelWidth + gapX);
    const y = margin + row * (labelHeight + gapY);

    drawTableLabel(doc, table, x, y, labelWidth, labelHeight);
  });

  doc.save('todas-mesas-qrcode.pdf');
};

const drawTableLabel = (
  doc: jsPDF, 
  data: TableQRData, 
  x: number, 
  y: number, 
  width: number = 100, 
  height: number = 60
) => {
  // Background com borda
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(30, 64, 175); // Azul escuro
  doc.setLineWidth(1);
  doc.rect(x, y, width, height, 'FD');

  // Área do logo (lado esquerdo)
  const logoAreaWidth = width * 0.25;
  doc.setFillColor(30, 64, 175);
  doc.rect(x, y, logoAreaWidth, height, 'F');
  
  // Texto "LOGO DO COMERCIO"
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  const logoText = data.commerceName.substring(0, 12).toUpperCase();
  doc.text(logoText, x + logoAreaWidth / 2, y + height / 2 - 3, { align: 'center' });
  doc.text('', x + logoAreaWidth / 2, y + height / 2 + 3, { align: 'center' });

  // Área central (mensagem + mesa)
  const centerStartX = x + logoAreaWidth;
  const centerWidth = width * 0.4;
  
  // Header "Bem Vindo (a)"
  doc.setFillColor(30, 64, 175);
  doc.rect(centerStartX, y, centerWidth, height * 0.35, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Bem Vindo (a)', centerStartX + centerWidth / 2, y + 8, { align: 'center' });
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Escanei o QrCod e faça seu pedido', centerStartX + centerWidth / 2, y + 14, { align: 'center' });

  // Mesa número
  doc.setFillColor(30, 64, 175);
  doc.rect(centerStartX, y + height * 0.4, centerWidth, height * 0.25, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`MESA ${String(data.tableNumber).padStart(2, '0')}`, centerStartX + centerWidth / 2, y + height * 0.55, { align: 'center' });

  // Área do QR Code (lado direito)
  const qrAreaX = centerStartX + centerWidth;
  const qrAreaWidth = width * 0.35;
  doc.setFillColor(30, 64, 175);
  doc.rect(qrAreaX, y, qrAreaWidth, height, 'F');

  // Texto acima do QR
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text('QRCOD QUE LEVA', qrAreaX + qrAreaWidth / 2, y + 8, { align: 'center' });
  doc.text('PARA', qrAreaX + qrAreaWidth / 2, y + 12, { align: 'center' });
  doc.text('www.mobdega.shop', qrAreaX + qrAreaWidth / 2, y + 16, { align: 'center' });

  // QR Code placeholder
  const qrSize = 22;
  const qrX = qrAreaX + (qrAreaWidth - qrSize) / 2;
  const qrY = y + 20;
  
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX, qrY, qrSize, qrSize, 'F');

  // QR Code pattern simplificado
  doc.setFillColor(0, 0, 0);
  const cellSize = qrSize / 21;
  
  // Cantos do QR
  // Top-left
  doc.rect(qrX + cellSize, qrY + cellSize, 5 * cellSize, 5 * cellSize, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX + 2 * cellSize, qrY + 2 * cellSize, 3 * cellSize, 3 * cellSize, 'F');
  doc.setFillColor(0, 0, 0);
  doc.rect(qrX + 3 * cellSize, qrY + 3 * cellSize, 1 * cellSize, 1 * cellSize, 'F');

  // Top-right
  doc.rect(qrX + 15 * cellSize, qrY + cellSize, 5 * cellSize, 5 * cellSize, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX + 16 * cellSize, qrY + 2 * cellSize, 3 * cellSize, 3 * cellSize, 'F');
  doc.setFillColor(0, 0, 0);
  doc.rect(qrX + 17 * cellSize, qrY + 3 * cellSize, 1 * cellSize, 1 * cellSize, 'F');

  // Bottom-left
  doc.rect(qrX + cellSize, qrY + 15 * cellSize, 5 * cellSize, 5 * cellSize, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX + 2 * cellSize, qrY + 16 * cellSize, 3 * cellSize, 3 * cellSize, 'F');
  doc.setFillColor(0, 0, 0);
  doc.rect(qrX + 3 * cellSize, qrY + 17 * cellSize, 1 * cellSize, 1 * cellSize, 'F');

  // Padrão de dados
  const seed = data.tableNumber + data.commerceId.charCodeAt(0);
  for (let i = 8; i < 14; i++) {
    for (let j = 1; j < 20; j++) {
      if ((i * j + seed) % 3 === 0) {
        doc.rect(qrX + j * cellSize, qrY + i * cellSize, cellSize * 0.9, cellSize * 0.9, 'F');
      }
    }
  }
};
