

## Aviso de carregamento e otimizacao dos videos

### Resumo

Adicionar um alerta informativo no topo da pagina de treinamento pedindo paciencia ao carregar os videos, e aplicar tecnicas de carregamento otimizado nas thumbnails e no player de video.

### Alteracoes

**Arquivo: `src/components/commerce/CommerceTraining.tsx`**

**1. Aviso no topo (abaixo da barra de progresso, acima dos cards)**
- Adicionar um `Alert` com icone `Info` (lucide) e fundo azul claro, com a mensagem:
  - Titulo: "Dica"
  - Texto: "Os videos podem levar alguns segundos para carregar. Por favor, aguarde um momento apos clicar em um video."

**2. Otimizacao de carregamento**
- Nas imagens de thumbnail dos cards: adicionar `loading="lazy"` para carregar somente quando visivel na tela
- No player de video direto (tag `<video>`): usar `preload="metadata"` em vez de carregar o arquivo inteiro de uma vez (carrega apenas informacoes basicas do video ate o usuario dar play)
- No iframe do YouTube: adicionar `loading="lazy"` para adiar o carregamento de videos fora da viewport

Nenhuma alteracao no banco de dados.

