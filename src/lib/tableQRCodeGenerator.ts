import jsPDF from 'jspdf';
import QRCode from 'qrcode';

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

// URL de destino do QR Code
const MOBDEGA_URL = 'https://mobdega.shop';

// Gera QR Code como Data URL (base64)
const generateQRCodeDataURL = async (url: string): Promise<string> => {
  return await QRCode.toDataURL(url, {
    width: 200,
    margin: 0,
    color: { dark: '#000000', light: '#FFFFFF' }
  });
};

// Carrega a imagem como base64
const loadImageAsBase64 = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

// Gera etiqueta individual com design profissional Mobdega
export const generateTableQRCodePDF = async (data: TableQRData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [90, 130], // Formato otimizado para etiqueta
  });

  // Gerar QR Code dinâmico
  const qrCodeBase64 = await generateQRCodeDataURL(MOBDEGA_URL);
  const logoBase64 = data.commerceLogoUrl ? await loadImageAsBase64(data.commerceLogoUrl) : null;

  await drawProfessionalLabel(doc, data, 0, 0, 90, 130, qrCodeBase64, logoBase64);

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
  const margin = 10;
  const labelWidth = 90;
  const labelHeight = 130;
  const cols = 2;
  const rows = 2;
  const gapX = (pageWidth - margin * 2 - labelWidth * cols) / (cols > 1 ? cols - 1 : 1);
  const gapY = (pageHeight - margin * 2 - labelHeight * rows) / (rows > 1 ? rows - 1 : 1);

  // Gerar QR Code dinâmico uma vez e reutilizar
  const qrCodeBase64 = await generateQRCodeDataURL(MOBDEGA_URL);
  const logoBase64 = tables.length > 0 && tables[0].commerceLogoUrl 
    ? await loadImageAsBase64(tables[0].commerceLogoUrl) 
    : null;

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

    await drawProfessionalLabel(doc, table, x, y, labelWidth, labelHeight, qrCodeBase64, logoBase64);
  }

  doc.save('todas-mesas-qrcode.pdf');
};

const drawProfessionalLabel = async (
  doc: jsPDF, 
  data: TableQRData, 
  x: number, 
  y: number, 
  width: number, 
  height: number,
  qrCodeBase64: string,
  logoBase64: string | null
) => {
  // Background escuro principal com borda arredondada
  doc.setFillColor(DARK_BG.r, DARK_BG.g, DARK_BG.b);
  doc.roundedRect(x, y, width, height, 5, 5, 'F');

  // Borda laranja externa
  doc.setDrawColor(MOBDEGA_ORANGE.r, MOBDEGA_ORANGE.g, MOBDEGA_ORANGE.b);
  doc.setLineWidth(2.5);
  doc.roundedRect(x + 2, y + 2, width - 4, height - 4, 4, 4, 'S');

  // Header com fundo laranja - altura aumentada para caber todo o texto
  const headerHeight = 32;
  const headerX = x + 6;
  const headerY = y + 6;
  const headerWidth = width - 12;
  
  doc.setFillColor(MOBDEGA_ORANGE.r, MOBDEGA_ORANGE.g, MOBDEGA_ORANGE.b);
  doc.roundedRect(headerX, headerY, headerWidth, headerHeight, 3, 3, 'F');

  // Logo do comércio (sem círculo branco)
  const logoSize = 24;
  const logoX = headerX + 4;
  const logoY = headerY + (headerHeight - logoSize) / 2;
  
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch {
      // Se falhar, não desenha nada
    }
  }

  // Nome do comércio no header - tamanho dinâmico para caber completo
  const textStartX = logoX + logoSize + 4;
  const availableWidth = headerWidth - logoSize - 12; // Espaço disponível para o nome
  
  // Calcula tamanho da fonte baseado no comprimento do nome
  let fontSize = 14;
  if (data.commerceName.length > 20) {
    fontSize = 8;
  } else if (data.commerceName.length > 16) {
    fontSize = 9;
  } else if (data.commerceName.length > 12) {
    fontSize = 10;
  } else if (data.commerceName.length > 10) {
    fontSize = 12;
  }
  
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(data.commerceName, textStartX, headerY + 12);

  // Texto de boas-vindas - uma linha só
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text('Bem-vindo(a)! Escaneie o QR Code abaixo.', textStartX, headerY + 20);

  // Seção do número da mesa - centralizada
  const mesaY = y + headerHeight + 22;
  
  // Label "MESA"
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 180, 180);
  doc.text('MESA', x + width / 2, mesaY, { align: 'center' });

  // Número da mesa - grande e destacado
  doc.setFontSize(38);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(MOBDEGA_ORANGE.r, MOBDEGA_ORANGE.g, MOBDEGA_ORANGE.b);
  doc.text(String(data.tableNumber).padStart(2, '0'), x + width / 2, mesaY + 14, { align: 'center' });

  // Nome da mesa (se houver)
  let extraOffset = 0;
  if (data.tableName) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(data.tableName, x + width / 2, mesaY + 22, { align: 'center' });
    extraOffset = 4;
  }

  // Área do QR Code - 20mm e centralizado
  const qrSize = 20;
  const qrY = mesaY + 28 + extraOffset;
  const qrX = x + (width - qrSize) / 2;
  
  // Fundo branco para QR com padding
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 2, 2, 'F');

  // Adicionar QR Code dinâmico
  try {
    doc.addImage(qrCodeBase64, 'PNG', qrX, qrY, qrSize, qrSize);
  } catch {
    doc.setFillColor(200, 200, 200);
    doc.rect(qrX, qrY, qrSize, qrSize, 'F');
  }

  // Texto instrução
  const instructionY = qrY + qrSize + 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(MOBDEGA_GREEN.r, MOBDEGA_GREEN.g, MOBDEGA_GREEN.b);
  doc.text('Escaneie e faça seu pedido!', x + width / 2, instructionY, { align: 'center' });

  // Rodapé com site
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('www.mobdega.shop', x + width / 2, height + y - 6, { align: 'center' });
};
