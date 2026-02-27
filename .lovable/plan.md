

## Mostrar e alterar senha de gestao diretamente no modal de edicao

### O que muda

A aba "Seguranca" do modal de edicao de comercio deixa de enviar email de reset e passa a:
1. Mostrar a senha de gestao atual do comercio (com toggle para ver/ocultar)
2. Permitir que o admin altere a senha diretamente, salvando no banco

### Alteracoes

**Arquivo 1: `src/components/admin/AdminCommerces.tsx`**
- Adicionar `management_password: string | null` na interface `Commerce` (linha ~77)

**Arquivo 2: `src/components/admin/CommerceEditModal.tsx`**
- Adicionar `management_password` na interface `Commerce`
- Substituir toda a `TabsContent value="seguranca"` por:
  - Exibicao da senha atual com botao de ver/ocultar (se existir, senao mostra "Nenhuma senha configurada")
  - Campo para digitar nova senha com botao de gerar senha aleatoria
  - Botao "Salvar Nova Senha" que faz update direto na tabela `commerces`
- Remover imports e estados relacionados ao reset por email (`resetPasswordForEmail`, `tempPassword`, etc.)

**Banco de dados**: Nenhuma alteracao necessaria, `management_password` ja existe como texto na tabela.

**Registro no feed**: 1 insert em `system_updates` documentando a mudanca.

