
# Plano: Ordenar Comércios por Proximidade de CEP no Explorar

## Problema Identificado

Na aba "Explorar" do Dashboard do Usuário, os comércios não estão sendo ordenados por proximidade ao CEP do usuário. A listagem aparece na ordem de criação (mais recente primeiro) em vez de mostrar os comércios mais próximos primeiro.

### Análise Técnica

O código atual em `UserDashboard.tsx`:
- **Interface Commerce** não inclui o campo `cep`
- **fetchCommerces** não mapeia o campo `cep` dos dados retornados
- **Não há lógica de ordenação** por proximidade como existe no `FeaturedStores.tsx`
- O perfil do usuário possui o CEP (`profile.cep`), mas não é usado para ordenar

A função RPC `get_public_commerces` **já retorna o campo `cep`**, então só preciso utilizá-lo no frontend.

---

## Solução Proposta

### Arquivo: `src/pages/user/UserDashboard.tsx`

#### 1. Atualizar a Interface Commerce
Adicionar o campo `cep` na interface:

```typescript
interface Commerce {
  id: string;
  fantasy_name: string;
  logo_url: string | null;
  cover_url: string | null;
  city: string | null;
  neighborhood: string | null;
  cep: string | null;  // NOVO
  is_open: boolean | null;
  opening_hours: OpeningHours | null;
  whatsapp: string | null;
  averageRating?: number;
  reviewCount?: number;
}
```

#### 2. Importar a Função de Proximidade
Adicionar a importação do `getCepProximityScore`:

```typescript
import { fetchAddressByCep, formatCep, getCepProximityScore } from "@/lib/viaCepService";
```

#### 3. Modificar fetchCommerces para Incluir o CEP
Passar o campo `cep` ao mapear os comércios:

```typescript
return {
  id: commerce.id,
  fantasy_name: commerce.fantasy_name,
  logo_url: commerce.logo_url,
  cover_url: commerce.cover_url,
  city: commerce.city,
  neighborhood: commerce.neighborhood,
  cep: commerce.cep,  // NOVO
  is_open: commerce.is_open,
  opening_hours: commerce.opening_hours,
  whatsapp: commerce.whatsapp,
  averageRating,
  reviewCount
};
```

#### 4. Ordenar por Proximidade Após Carregar os Dados
Ordenar os comércios usando o CEP do perfil:

```typescript
// Ordenar por proximidade ao CEP do usuário
if (profile?.cep) {
  commercesWithRatings.sort((a, b) => {
    if (!a.cep && !b.cep) return 0;
    if (!a.cep) return 1;
    if (!b.cep) return -1;
    
    const scoreA = getCepProximityScore(profile.cep!, a.cep);
    const scoreB = getCepProximityScore(profile.cep!, b.cep);
    return scoreA - scoreB;
  });
}

setCommerces(commercesWithRatings);
```

#### 5. Garantir que fetchCommerces Tenha Acesso ao Perfil
Modificar a ordem de execução para que o perfil seja carregado antes dos comércios, ou passar o CEP como dependência:

```typescript
// Modificar fetchCommerces para receber o CEP como parâmetro
const fetchCommerces = async (userCep?: string | null) => {
  // ... lógica atual ...
  
  // Ordenar após processar
  if (userCep) {
    commercesWithRatings.sort((a, b) => {
      // lógica de ordenação
    });
  }
  
  setCommerces(commercesWithRatings);
};
```

---

## Fluxo de Dados

```text
+------------------+     +-------------------+     +----------------------+
|  Carregar Perfil | --> | Obter CEP usuário | --> | Buscar Comércios RPC |
+------------------+     +-------------------+     +----------------------+
                                                             |
                                                             v
                              +-----------------------------+
                              | Ordenar por getCepProximityScore |
                              | (menor score = mais próximo)     |
                              +-----------------------------+
                                                             |
                                                             v
                              +-----------------------------+
                              | Exibir lista ordenada       |
                              | (mais próximos primeiro)    |
                              +-----------------------------+
```

---

## Resultado Esperado

- Os comércios na aba "Explorar" serão ordenados do **mais próximo** ao **mais distante** do CEP do usuário
- Se o usuário não tiver CEP cadastrado, a ordenação será pela ordem padrão (mais recente)
- Consistência com o comportamento do `FeaturedStores.tsx` na landing page
