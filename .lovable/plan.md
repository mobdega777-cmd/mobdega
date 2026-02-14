

## Corrigir "Atualizacoes do Sistema" - Apenas Implementacoes da Plataforma

### Problema

Os triggers de banco de dados (`trg_system_update_commerces`, `trg_system_update_invoices`, `trg_system_update_plans`) estao inserindo registros operacionais (novos cadastros, mudancas de status) na tabela `system_updates`. Isso polui o feed com atividades cotidianas em vez de mostrar apenas as melhorias/implementacoes da plataforma.

### Solucao

**1. Migracao SQL - Remover triggers e limpar dados**
- Dropar os 3 triggers: `trg_system_update_commerces`, `trg_system_update_invoices`, `trg_system_update_plans`
- Dropar a funcao `log_system_update()` que nao tera mais uso
- Deletar da tabela `system_updates` os registros operacionais (que foram gerados automaticamente por triggers, identificaveis pelo conteudo como "Novo comercio cadastrado", "Status do comercio", "Plano atualizado: Basico", etc.)
- Inserir registros das implementacoes recentes que fizemos:
  - Checkbox de progresso nos videos de treinamento
  - Botao Relatorio de Estoque movido do Financeiro para Controle de Estoque
  - Aviso de carregamento e otimizacao de videos na pagina de treinamento
- Habilitar realtime na tabela `system_updates`

**2. Painel Admin - Gerenciar Atualizacoes do Sistema**
- Criar componente `AdminSystemUpdates.tsx` dentro do painel admin
- Formulario para adicionar novas atualizacoes com campos: tipo (create/update/config), modulo, descricao
- Lista das atualizacoes existentes com opcao de deletar
- Adicionar no menu lateral do AdminDashboard como nova secao

**3. Realtime no feed do comercio**
- Atualizar `SystemUpdates.tsx` para escutar mudancas em tempo real na tabela `system_updates` via canal Supabase
- Quando o admin inserir uma nova atualizacao, ela aparece instantaneamente no feed dos comercios

### Arquivos afetados

- **Nova migracao SQL**: dropar triggers/funcao, limpar dados, inserir implementacoes recentes, habilitar realtime
- **Novo**: `src/components/admin/AdminSystemUpdates.tsx` - painel para gerenciar atualizacoes
- **Editar**: `src/pages/admin/AdminDashboard.tsx` - adicionar nova secao no menu
- **Editar**: `src/components/commerce/SystemUpdates.tsx` - adicionar realtime subscription
