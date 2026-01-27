
# Plano: Correção dos QR Codes das Etiquetas de Mesa

## Problema Identificado
O QR Code nas etiquetas de mesa não está funcionando corretamente. Ao escanear, ele mostra uma "nota" (texto) ao invés de redirecionar para o site **mobdega.shop**. Isso acontece porque o sistema está usando uma **imagem estática** (`/images/qrcode-mobdega.png`) que foi gerada manualmente e não contém uma URL funcional codificada.

## Solução Proposta
Implementar **geração dinâmica de QR Codes** usando a biblioteca `qrcode` do NPM, que irá:
1. Gerar QR Codes únicos com a URL correta do Mobdega
2. Cada QR Code será gerado como uma imagem base64 no momento da criação do PDF
3. O QR Code irá apontar para `https://mobdega.shop` (ou a URL publicada do projeto)

## Etapas de Implementação

### 1. Instalar Biblioteca de QR Code
Adicionar a biblioteca `qrcode` ao projeto para geração dinâmica de QR Codes.

```text
npm install qrcode
npm install @types/qrcode --save-dev
```

### 2. Atualizar o Gerador de Etiquetas
Modificar o arquivo `src/lib/tableQRCodeGenerator.ts`:

**Mudanças principais:**
- Importar a biblioteca `qrcode`
- Criar função `generateQRCodeDataURL()` que gera QR Code como base64
- Definir a URL de destino como `https://mobdega.shop` (URL padrão para todas as etiquetas)
- Remover referência à imagem estática `/images/qrcode-mobdega.png`
- Manter todo o layout atual das etiquetas (tamanho 20mm, centralizado, etc.)

```text
// Exemplo da nova função de geração
import QRCode from 'qrcode';

const generateQRCodeDataURL = async (url: string): Promise<string> => {
  return await QRCode.toDataURL(url, {
    width: 200,
    margin: 0,
    color: { dark: '#000000', light: '#FFFFFF' }
  });
};
```

### 3. Atualizar Funções de Geração de PDF
- `generateTableQRCodePDF()`: Usar QR Code dinâmico
- `generateAllTablesQRCodePDF()`: Usar QR Code dinâmico (gera uma vez e reutiliza)
- `drawProfessionalLabel()`: Receber o QR Code base64 gerado dinamicamente

### 4. URL de Destino
O QR Code irá redirecionar para: **https://mobdega.shop**
- Esta é a URL padrão para todos os comércios
- Quando o cliente escanear, será direcionado ao site principal do Mobdega

---

## Detalhes Técnicos

### Biblioteca Escolhida: `qrcode`
- Pacote NPM mais popular para geração de QR Codes
- Suporta geração direta para Data URL (base64)
- Compatível com browsers e Node.js
- Tamanho pequeno (~12KB gzipped)

### Formato de Saída
```text
QRCode.toDataURL('https://mobdega.shop', options)
// Retorna: "data:image/png;base64,iVBORw0KGgoAAAAN..."
```

### Código Atualizado (Resumo)
```text
// Antes (imagem estática)
const STANDARD_QR_CODE_PATH = '/images/qrcode-mobdega.png';
const qrCodeBase64 = await loadImageAsBase64(STANDARD_QR_CODE_PATH);

// Depois (geração dinâmica)
import QRCode from 'qrcode';
const MOBDEGA_URL = 'https://mobdega.shop';
const qrCodeBase64 = await QRCode.toDataURL(MOBDEGA_URL, { width: 200, margin: 0 });
```

---

## Resultado Esperado
- Ao escanear o QR Code, o celular reconhecerá como URL
- O usuário será redirecionado automaticamente para **mobdega.shop**
- Layout das etiquetas permanece inalterado (20mm, centralizado, design profissional)
- Funciona tanto para etiqueta individual quanto para impressão de todas as mesas

## Arquivos Afetados
1. `package.json` - Adicionar dependência `qrcode`
2. `src/lib/tableQRCodeGenerator.ts` - Implementar geração dinâmica

## Estimativa
- Complexidade: Baixa
- Tempo estimado: ~15 minutos
