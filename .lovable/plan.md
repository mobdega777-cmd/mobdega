
# Correção do Ícone PWA no Android

## Problema Identificado

O `manifest.json` está usando `/favicon.ico` que contém o ícone antigo da Lovable (coração). Enquanto isso, o `index.html` já usa a URL correta do logo Mobdega para o favicon do navegador.

## Solução

Atualizar o `manifest.json` para usar as imagens corretas do Mobdega que já estão hospedadas no Google Cloud Storage.

## Alterações Necessárias

### Arquivo: `public/manifest.json`

Atualizar os ícones para usar as URLs do logo Mobdega:

```json
{
  "name": "Mobdega",
  "short_name": "Mobdega",
  "description": "Adegas e Tabacarias na sua mão",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#F97316",
  "icons": [
    {
      "src": "https://storage.googleapis.com/gpt-engineer-file-uploads/WMFM4WXgTkbC1T9iHTKkZAL8ITo2/uploads/1768697291138-ChatGPT_Image_16_de_jan._de_2026__23_12_48-removebg-preview.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "https://storage.googleapis.com/gpt-engineer-file-uploads/WMFM4WXgTkbC1T9iHTKkZAL8ITo2/uploads/1768697291138-ChatGPT_Image_16_de_jan._de_2026__23_12_48-removebg-preview.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "https://storage.googleapis.com/gpt-engineer-file-uploads/WMFM4WXgTkbC1T9iHTKkZAL8ITo2/uploads/1768697291138-ChatGPT_Image_16_de_jan._de_2026__23_12_48-removebg-preview.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "orientation": "portrait",
  "categories": ["food", "shopping", "lifestyle"]
}
```

## Por que isso resolve?

1. **Android usa o manifest.json** - Quando você clica em "Adicionar à tela inicial", o Android lê o `manifest.json` para obter o ícone
2. **URLs externas funcionam** - O manifest aceita URLs absolutas, então podemos usar as mesmas imagens já hospedadas
3. **Separação de purpose** - Usamos `"any"` para ícones normais e `"maskable"` para ícones adaptativos do Android

## Importante

Após a correção:
- Limpar o cache do navegador no celular
- Remover o ícone antigo da tela inicial
- Adicionar novamente usando "Adicionar à tela inicial"

---

## Detalhes Técnicos

| Item | Antes | Depois |
|------|-------|--------|
| Ícone 192x192 | `/favicon.ico` (Lovable) | URL do logo Mobdega |
| Ícone 512x512 | `/favicon.ico` (Lovable) | URL do logo Mobdega |
| Tipo | `image/x-icon` | `image/png` |
