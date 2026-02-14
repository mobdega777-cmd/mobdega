
## Correcao: Data de Nascimento exibida 1 dia antes

### Problema

Quando a data de nascimento e armazenada como `"1996-01-24"` (formato YYYY-MM-DD), o JavaScript interpreta como meia-noite UTC. No fuso horario do Brasil (UTC-3), isso vira 23/01/1996 as 21h, mostrando o dia anterior.

### Solucao

Criar uma funcao utilitaria que faz o parse da data sem conversao de timezone, e aplicar nos 3 locais onde a data de nascimento e exibida.

### Arquivos a alterar

**1. `src/lib/dateUtils.ts`** - Adicionar funcao utilitaria:

```typescript
/**
 * Converte uma string de data (YYYY-MM-DD) para Date sem
 * conversao de timezone, evitando o problema de voltar 1 dia.
 */
export const parseDateOnly = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
};
```

**2. `src/pages/user/UserDashboard.tsx`** (linha 992):
```typescript
// De:
format(new Date(profile.birthday), "dd/MM/yyyy")
// Para:
format(parseDateOnly(profile.birthday), "dd/MM/yyyy")
```

**3. `src/components/admin/UserDetailsModal.tsx`** (linha 210):
```typescript
// De:
new Date(user.birthday).toLocaleDateString('pt-BR')
// Para:
format(parseDateOnly(user.birthday), "dd/MM/yyyy")
```

**4. `src/components/admin/AdminCustomers.tsx`** (linha 500):
```typescript
// De:
format(new Date(selectedCustomer.birthday), "dd/MM/yyyy")
// Para:
format(parseDateOnly(selectedCustomer.birthday), "dd/MM/yyyy")
```

### Resultado

A data cadastrada (24/01/1996) sera exibida corretamente em todos os locais, sem deslocamento por timezone.
