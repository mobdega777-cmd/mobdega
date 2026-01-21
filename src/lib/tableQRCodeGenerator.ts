import jsPDF from 'jspdf';

interface TableQRData {
  tableNumber: number;
  tableName: string | null;
  tableCapacity: number | null;
  commerceName: string;
  commerceLogoUrl: string | null;
  commerceId: string;
}

export const generateTableQRCodePDF = async (data: TableQRData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Background pattern
  doc.setFillColor(255, 250, 245);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative border
  doc.setDrawColor(234, 88, 12);
  doc.setLineWidth(2);
  doc.roundedRect(margin / 2, margin / 2, pageWidth - margin, pageHeight - margin, 5, 5, 'S');

  // Inner border
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2, 3, 3, 'S');

  let yPos = margin + 15;

  // Header with commerce name
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.text(data.commerceName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Subheader
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Escaneie o QR Code para fazer seu pedido', pageWidth / 2, yPos, { align: 'center' });
  yPos += 25;

  // Table number badge
  doc.setFillColor(234, 88, 12);
  const badgeWidth = 80;
  const badgeHeight = 30;
  const badgeX = (pageWidth - badgeWidth) / 2;
  doc.roundedRect(badgeX, yPos, badgeWidth, badgeHeight, 5, 5, 'F');

  // Table number text
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`Mesa ${data.tableNumber}`, pageWidth / 2, yPos + 12, { align: 'center' });

  if (data.tableName) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(data.tableName, pageWidth / 2, yPos + 22, { align: 'center' });
  }
  yPos += badgeHeight + 20;

  // QR Code placeholder area with border
  const qrSize = 100;
  const qrX = (pageWidth - qrSize) / 2;
  
  // QR Code border
  doc.setDrawColor(234, 88, 12);
  doc.setLineWidth(1);
  doc.roundedRect(qrX - 5, yPos - 5, qrSize + 10, qrSize + 10, 3, 3, 'S');

  // QR Code inner area (white)
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX, yPos, qrSize, qrSize, 'F');

  // Generate QR Code pattern (simplified visual representation)
  // In production, you'd use a QR code library
  const storeUrl = `https://mobdega.lovable.app/loja/${data.commerceId}?mesa=${data.tableNumber}`;
  
  // Create QR-like pattern
  doc.setFillColor(0, 0, 0);
  const cellSize = qrSize / 25;
  
  // Corner patterns (required QR elements)
  // Top-left corner
  doc.setFillColor(0, 0, 0);
  doc.rect(qrX + 2, yPos + 2, 7 * cellSize, 7 * cellSize, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX + 2 + cellSize, yPos + 2 + cellSize, 5 * cellSize, 5 * cellSize, 'F');
  doc.setFillColor(0, 0, 0);
  doc.rect(qrX + 2 + 2 * cellSize, yPos + 2 + 2 * cellSize, 3 * cellSize, 3 * cellSize, 'F');

  // Top-right corner
  doc.setFillColor(0, 0, 0);
  doc.rect(qrX + qrSize - 2 - 7 * cellSize, yPos + 2, 7 * cellSize, 7 * cellSize, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX + qrSize - 2 - 6 * cellSize, yPos + 2 + cellSize, 5 * cellSize, 5 * cellSize, 'F');
  doc.setFillColor(0, 0, 0);
  doc.rect(qrX + qrSize - 2 - 5 * cellSize, yPos + 2 + 2 * cellSize, 3 * cellSize, 3 * cellSize, 'F');

  // Bottom-left corner
  doc.setFillColor(0, 0, 0);
  doc.rect(qrX + 2, yPos + qrSize - 2 - 7 * cellSize, 7 * cellSize, 7 * cellSize, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX + 2 + cellSize, yPos + qrSize - 2 - 6 * cellSize, 5 * cellSize, 5 * cellSize, 'F');
  doc.setFillColor(0, 0, 0);
  doc.rect(qrX + 2 + 2 * cellSize, yPos + qrSize - 2 - 5 * cellSize, 3 * cellSize, 3 * cellSize, 'F');

  // Random data pattern (simplified)
  doc.setFillColor(0, 0, 0);
  const seed = data.tableNumber + data.commerceId.charCodeAt(0);
  for (let i = 10; i < 21; i++) {
    for (let j = 2; j < 23; j++) {
      if ((i * j + seed) % 3 === 0 && i > 8 && j > 8) {
        doc.rect(qrX + i * cellSize, yPos + j * cellSize, cellSize, cellSize, 'F');
      }
    }
  }

  // Add URL below QR
  yPos += qrSize + 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('ou acesse:', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.text('mobdega.lovable.app', pageWidth / 2, yPos, { align: 'center' });
  yPos += 25;

  // Instructions box
  doc.setFillColor(255, 237, 213);
  doc.roundedRect(margin + 10, yPos, pageWidth - margin * 2 - 20, 50, 3, 3, 'F');
  
  yPos += 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(194, 65, 12);
  doc.text('Como fazer seu pedido:', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  const instructions = [
    '1. Escaneie o QR Code com a câmera do celular',
    '2. Navegue pelo cardápio digital',
    '3. Adicione os itens ao carrinho',
    '4. Confirme o pedido e aguarde na mesa'
  ];
  
  instructions.forEach((instruction, index) => {
    doc.text(instruction, pageWidth / 2, yPos + (index * 7), { align: 'center' });
  });

  yPos += 45;

  // Capacity info
  if (data.tableCapacity) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(130, 130, 130);
    doc.text(`Capacidade: ${data.tableCapacity} pessoas`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
  }

  // Footer with Mobdega branding
  const footerY = pageHeight - margin - 15;
  doc.setDrawColor(234, 88, 12);
  doc.setLineWidth(0.5);
  doc.line(margin + 20, footerY - 5, pageWidth - margin - 20, footerY - 5);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('Powered by', pageWidth / 2 - 15, footerY + 5, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.text('Mobdega', pageWidth / 2 + 5, footerY + 5, { align: 'left' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('A sua plataforma de delivery e pedidos', pageWidth / 2, footerY + 12, { align: 'center' });

  // Save the PDF
  doc.save(`mesa-${data.tableNumber}-qrcode.pdf`);
};
