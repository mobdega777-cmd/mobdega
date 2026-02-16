

## Atualizar Valores do MEI 2026 no Modal de Impostos

### O que muda

O valor informativo do MEI no modal de configuracao de impostos esta desatualizado. Sera corrigido de "R$ 71,60 a R$ 76,60/mes" para "R$ 82,05 a R$ 87,05/mes", refletindo o reajuste do salario minimo para R$ 1.621,00 em 2026.

### Referencia dos novos valores (DAS MEI 2026)

| Atividade | INSS (5%) | ICMS | ISS | Total |
|---|---|---|---|---|
| Comercio/Industria | R$ 81,05 | R$ 1,00 | - | R$ 82,05 |
| Servicos | R$ 81,05 | - | R$ 5,00 | R$ 86,05 |
| Comercio + Servicos | R$ 81,05 | R$ 1,00 | R$ 5,00 | R$ 87,05 |

### Alteracao

**Arquivo:** `src/components/commerce/TaxConfigModal.tsx`
- Linha 86: Alterar `taxRange` do MEI de `"Fixo: R$ 71,60 a R$ 76,60/mes"` para `"Fixo: R$ 82,05 a R$ 87,05/mes"`

### Registro no feed de atualizacoes

Inserir 1 registro na tabela `system_updates`:
- Tipo: `update`
- Modulo: `Financeiro`
- Descricao: "Valores do DAS MEI atualizados para 2026 (R$ 82,05 a R$ 87,05/mes) conforme novo salario minimo de R$ 1.621,00"

### Detalhes tecnicos

- Apenas uma string alterada em um arquivo
- Nenhuma alteracao de banco de dados estrutural
- Nenhuma nova dependencia
